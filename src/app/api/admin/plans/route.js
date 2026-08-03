import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

// GET all users who have investment plans based on status filter (pending, approved, rejected, all)
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const statusParam = (searchParams.get('status') || 'pending').toLowerCase();

    let dbFilter = {};
    if (statusParam === 'approved') {
      dbFilter = { 'investmentPlans.status': { $in: ['active', 'approved'] } };
    } else if (statusParam === 'rejected') {
      dbFilter = { 'investmentPlans.status': { $in: ['cancelled', 'rejected'] } };
    } else if (statusParam === 'pending') {
      dbFilter = { 'investmentPlans.status': 'pending' };
    } else {
      dbFilter = { 'investmentPlans.status': { $exists: true } };
    }

    const users = await User.find(dbFilter)
      .select('name phone email profilePicture investmentPlans')
      .lean();

    const planRequests = [];
    for (const user of users) {
      if (!user || !user.investmentPlans || !Array.isArray(user.investmentPlans)) continue;

      const activePlan = [...(user.investmentPlans)].reverse().find(p => p && (p.status === 'active' || p.status === 'approved'));
      const currentPlanName = activePlan ? activePlan.planName : 'Free';

      for (const plan of user.investmentPlans) {
        if (!plan) continue;

        const pStatus = String(plan.status || 'pending').toLowerCase();

        if (statusParam === 'approved' && pStatus !== 'active' && pStatus !== 'approved') {
          continue;
        }
        if (statusParam === 'rejected' && pStatus !== 'cancelled' && pStatus !== 'rejected') {
          continue;
        }
        if (statusParam === 'pending' && pStatus !== 'pending') {
          continue;
        }

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

        planRequests.push({
          userId: user._id ? String(user._id) : '',
          userName: user.name || 'Unknown User',
          userPhone: user.phone || '',
          userEmail: user.email || '',
          userProfilePicture: user.profilePicture || '',
          planId: plan._id ? String(plan._id) : (plan.id ? String(plan.id) : Math.random().toString()),
          planName: plan.planName || 'Plan',
          userCurrentPlan: currentPlanName,
          amount: plan.amount || 0,
          status: displayStatus,
          startDate: formattedDate,
          paymentMethod: plan.paymentMethod || 'N/A',
          trxId: plan.trxId || '',
          screenshotData: plan.screenshotData || plan.screenshotUrl || null
        });
      }
    }

    // Sort newest requests first
    planRequests.sort((a, b) => {
      const timeA = a.startDate !== '-' ? new Date(a.startDate).getTime() : 0;
      const timeB = b.startDate !== '-' ? new Date(b.startDate).getTime() : 0;
      return timeB - timeA;
    });

    return NextResponse.json(planRequests);
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
