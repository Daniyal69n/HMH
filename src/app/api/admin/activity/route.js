import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import UserInvestment from '@/models/UserInvestment';
import Transaction from '@/models/Transaction';

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 10;
    
    const activities = [];
    
    // Get recent user registrations
    const recentUsers = await User.find({})
      .select('name phone createdAt')
      .sort({ createdAt: -1 })
      .limit(limit);
    
    recentUsers.forEach(user => {
      activities.push({
        type: 'registration',
        message: `New user registered: ${user.name}`,
        date: user.createdAt,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        icon: '👤'
      });
    });
    
    // Get recent investments
    const recentInvestments = await UserInvestment.find({})
      .populate('planId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit);
    
    recentInvestments.forEach(investment => {
      activities.push({
        type: 'investment',
        message: `User invested in ${investment.planName}`,
        date: investment.createdAt,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: '💰',
        amount: investment.investAmount
      });
    });
    
    // Get recent transactions (recharge, withdraw, coupon_redeem, daily_income, referral_income)
    const recentTransactions = await Transaction.find({
      type: { $in: ['recharge', 'withdraw', 'coupon_redeem', 'daily_income', 'referral_income'] }
    })
      .sort({ createdAt: -1 })
      .limit(limit);
    
    recentTransactions.forEach(transaction => {
      let message = '';
      let icon = '';
      let color = '';
      let bgColor = '';
      
      switch (transaction.type) {
        case 'recharge':
          message = `User recharged Rs${transaction.amount}`;
          icon = '💳';
          color = 'text-purple-600';
          bgColor = 'bg-purple-100';
          break;
        case 'withdraw':
          message = `User withdrew Rs${transaction.amount}`;
          icon = '🏦';
          color = 'text-orange-600';
          bgColor = 'bg-orange-100';
          break;
        case 'coupon_redeem':
          message = `User redeemed coupon ${transaction.couponCode}`;
          icon = '🎫';
          color = 'text-yellow-600';
          bgColor = 'bg-yellow-100';
          break;
        case 'daily_income':
          message = `Daily income earned: Rs${transaction.amount}`;
          icon = '📈';
          color = 'text-green-600';
          bgColor = 'bg-green-100';
          break;
        case 'referral_income':
          message = `Referral commission earned: Rs${transaction.amount}`;
          icon = '👥';
          color = 'text-indigo-600';
          bgColor = 'bg-indigo-100';
          break;
      }
      
      activities.push({
        type: transaction.type,
        message,
        date: transaction.createdAt,
        color,
        bgColor,
        icon,
        amount: transaction.amount,
        status: transaction.status
      });
    });
    
    // Sort all activities by date (most recent first) and take the top limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
    
    return NextResponse.json(sortedActivities, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('Activity fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
