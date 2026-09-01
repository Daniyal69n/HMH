import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');

    if (!email && !phone) {
      return NextResponse.json({ status: 'not_found' }, { status: 400 });
    }

    const query = {};
    if (email && phone) {
      query.$or = [{ email: email.toLowerCase().trim() }, { phone: phone.trim() }];
    } else if (email) {
      query.email = email.toLowerCase().trim();
    } else {
      query.phone = phone.trim();
    }

    const user = await User.findOne(query).select('status investmentPlans name email phone').lean();

    if (!user) {
      return NextResponse.json({ status: 'not_found' });
    }

    const plans = user.investmentPlans || [];
    const hasActivePlan = plans.some(p => p.status === 'active' || p.status === 'approved');
    const hasPendingPlan = plans.some(p => p.status === 'pending');
    const hasCancelledOrRejectedPlan = plans.some(p => p.status === 'cancelled' || p.status === 'rejected');

    let overallStatus = 'pending';

    if (user.status === 'approved' || hasActivePlan) {
      overallStatus = 'approved';
    } else if (user.status === 'rejected' || (!hasPendingPlan && hasCancelledOrRejectedPlan)) {
      overallStatus = 'rejected';
    } else {
      overallStatus = 'pending';
    }

    return NextResponse.json({
      status: overallStatus,
      name: user.name,
      email: user.email,
      phone: user.phone
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Registration status check error:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
