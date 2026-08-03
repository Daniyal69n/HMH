import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

// GET all users who have investment plans based on status filter (pending, approved, rejected, all)
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const statusParam = (searchParams.get('status') || 'pending').toLowerCase();

    let targetDbStatus = statusParam;
    let findQuery = {};

    if (statusParam === 'approved') {
      targetDbStatus = 'active';
      findQuery = { 'investmentPlans.status': 'active' };
    } else if (statusParam === 'rejected') {
      targetDbStatus = 'cancelled';
      findQuery = { 'investmentPlans.status': 'cancelled' };
    } else if (statusParam === 'all') {
      findQuery = { 'investmentPlans.0': { $exists: true } };
    } else {
      targetDbStatus = 'pending';
      findQuery = { 'investmentPlans.status': 'pending' };
    }

    const users = await User.find(findQuery).select('-password').lean();

    const planRequests = [];
    for (const user of users) {
      const matchingPlans = user.investmentPlans.filter(p => {
        if (statusParam === 'all') return true;
        return p.status === targetDbStatus;
      });

      for (const plan of matchingPlans) {
        const activePlan = [...(user.investmentPlans || [])].reverse().find(p => p.status === 'active');
        const currentPlanName = activePlan ? activePlan.planName : 'Free';

        planRequests.push({
          userId: user._id,
          userName: user.name,
          userPhone: user.phone,
          userEmail: user.email,
          userProfilePicture: user.profilePicture || '',
          planId: plan._id,
          planName: plan.planName,
          userCurrentPlan: currentPlanName,
          amount: plan.amount,
          status: plan.status === 'active' ? 'approved' : (plan.status === 'cancelled' ? 'rejected' : plan.status),
          startDate: plan.startDate,
          paymentMethod: plan.paymentMethod,
          trxId: plan.trxId || '',
          screenshotData: plan.screenshotData || plan.screenshotUrl || null
        });
      }
    }

    return NextResponse.json(planRequests);
  } catch (error) {
    console.error('Get plan requests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
