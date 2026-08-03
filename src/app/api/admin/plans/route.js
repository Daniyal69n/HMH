import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

// GET all users who have investment plans based on status filter (pending, approved, rejected, all)
export async function GET(request) {
  const startTime = Date.now();
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const statusParam = (searchParams.get('status') || 'pending').toLowerCase();

    // Build MongoDB aggregation match criteria
    let matchSubdocumentStatus = {};
    if (statusParam === 'approved') {
      matchSubdocumentStatus = { 'investmentPlans.status': { $in: ['active', 'approved'] } };
    } else if (statusParam === 'rejected') {
      matchSubdocumentStatus = { 'investmentPlans.status': { $in: ['cancelled', 'rejected'] } };
    } else if (statusParam === 'pending') {
      matchSubdocumentStatus = { 'investmentPlans.status': 'pending' };
    } else {
      // all
      matchSubdocumentStatus = { 'investmentPlans.status': { $exists: true } };
    }

    console.log(`GET /api/admin/plans aggregation statusParam="${statusParam}"`);

    // High-performance MongoDB Aggregation Pipeline ($match -> $unwind -> $match -> $project -> $sort)
    const pipeline = [
      {
        $match: {
          'investmentPlans.0': { $exists: true }
        }
      },
      {
        $unwind: '$investmentPlans'
      },
      {
        $match: matchSubdocumentStatus
      },
      {
        $project: {
          _id: 1,
          name: 1,
          phone: 1,
          email: 1,
          profilePicture: 1,
          plan: '$investmentPlans'
        }
      },
      {
        $sort: { 'plan.startDate': -1 }
      }
    ];

    const dbStartTime = Date.now();
    const results = await User.aggregate(pipeline);
    const dbQueryTimeMs = Date.now() - dbStartTime;

    const planRequests = results.map(item => {
      const user = item;
      const plan = item.plan || {};

      const pStatus = String(plan.status || 'pending').toLowerCase();
      let displayStatus = 'pending';
      if (pStatus === 'active' || pStatus === 'approved') {
        displayStatus = 'approved';
      } else if (pStatus === 'cancelled' || pStatus === 'rejected') {
        displayStatus = 'rejected';
      }

      let formattedDate = '-';
      if (plan.startDate) {
        try {
          const d = new Date(plan.startDate);
          if (!isNaN(d.getTime())) {
            formattedDate = d.toISOString().split('T')[0];
          }
        } catch { }
      }

      return {
        userId: user._id ? String(user._id) : '',
        userName: user.name || 'Unknown User',
        userPhone: user.phone || '',
        userEmail: user.email || '',
        userProfilePicture: user.profilePicture || '',
        planId: plan._id ? String(plan._id) : (plan.id ? String(plan.id) : Math.random().toString()),
        planName: plan.planName || 'Plan',
        userCurrentPlan: plan.planName || 'Plan',
        amount: plan.amount || 0,
        status: displayStatus,
        startDate: formattedDate,
        paymentMethod: plan.paymentMethod || 'N/A',
        trxId: plan.trxId || '',
        screenshotData: plan.screenshotData || plan.screenshotUrl || null
      };
    });

    const totalExecutionTimeMs = Date.now() - startTime;

    // Performance metrics logging
    console.log(`[PERF_METRICS] status: "${statusParam}"`);
    console.log(`[PERF_METRICS] Database pipeline execution time: ${dbQueryTimeMs}ms`);
    console.log(`[PERF_METRICS] Number of plan records returned: ${results.length}`);
    console.log(`[PERF_METRICS] Total endpoint execution time: ${totalExecutionTimeMs}ms`);

    return NextResponse.json(planRequests, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Execution-Time-Ms': String(totalExecutionTimeMs)
      }
    });
  } catch (error) {
    console.error('Get plan requests error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

// PUT — approve or reject a user's plan
export async function PUT(request) {
  try {
    await connectDB();

    const { userId, planId, action } = await request.json();

    if (!userId || !planId || !action) {
      return NextResponse.json({ error: 'userId, planId, and action are required' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'approve') {
      // Find the plan request to approve
      const planToApprove = user.investmentPlans.find(p => p._id.toString() === planId.toString());
      if (!planToApprove) {
        return NextResponse.json({ error: 'Plan request not found' }, { status: 404 });
      }
      if (planToApprove.status === 'active') {
        return NextResponse.json({ error: 'Plan is already active. Cannot approve again.' }, { status: 400 });
      }
      const { activateUserPlan } = await import('@/lib/commission');
      // activateUserPlan calls user.save() internally, no need to save again
      await activateUserPlan(user, planToApprove);
    } else {
      // Reject
      const planToReject = user.investmentPlans.find(p => p._id.toString() === planId.toString());
      if (planToReject) {
        planToReject.status = 'cancelled';
      }
      await user.save();
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: `Plan ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      user
    });
  } catch (error) {
    console.error('Plan action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
