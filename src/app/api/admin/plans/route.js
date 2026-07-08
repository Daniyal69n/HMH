import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

// GET all users who have pending investment plans
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    // Find users who have investmentPlans with the given status
    const users = await User.find({
      'investmentPlans.status': status
    }).select('-password');

    // Flatten to a list of plan requests with user info
    const planRequests = [];
    for (const user of users) {
      const matchingPlans = user.investmentPlans.filter(p => p.status === status);
      for (const plan of matchingPlans) {
        planRequests.push({
          userId: user._id,
          userName: user.name,
          userPhone: user.phone,
          planId: plan._id,
          planName: plan.planName,
          amount: plan.amount,
          status: plan.status,
          startDate: plan.startDate
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

    const newStatus = action === 'approve' ? 'active' : 'cancelled';

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { 'investmentPlans.$[plan].status': newStatus } },
      {
        arrayFilters: [{ 'plan._id': planId }],
        new: true,
        runValidators: false
      }
    ).select('-password');

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
