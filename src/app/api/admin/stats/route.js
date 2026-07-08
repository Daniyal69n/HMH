import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function GET(request) {
  try {
    await connectDB();

    // 1. Total Users
    const totalUsers = await User.countDocuments();

    // 2. Pending Withdrawals
    const pendingWithdrawals = await Transaction.countDocuments({
      type: 'withdraw',
      status: 'pending'
    });

    // 3. Pending Plan Requests
    const usersWithPending = await User.find({
      'investmentPlans.status': 'pending'
    });
    let pendingPlanRequests = 0;
    for (const u of usersWithPending) {
      pendingPlanRequests += (u.investmentPlans || []).filter(p => p.status === 'pending').length;
    }

    // 4. Total Earnings Distributed (Sum of all users' earnBalance + all withdrawals)
    const userEarnBalances = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$earnBalance' } } }
    ]);
    const totalUserEarnBalance = userEarnBalances[0]?.total || 0;

    const allWithdrawals = await Transaction.aggregate([
      { $match: { type: 'withdraw' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalWithdrawalsAmount = allWithdrawals[0]?.total || 0;

    const totalEarningsDistributed = totalUserEarnBalance + totalWithdrawalsAmount;

    // 5. Total Withdrawals Paid
    const approvedWithdrawals = await Transaction.aggregate([
      { $match: { type: 'withdraw', status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalWithdrawalsPaid = approvedWithdrawals[0]?.total || 0;

    return NextResponse.json({
      totalUsers,
      pendingWithdrawals,
      pendingPlanRequests,
      totalEarningsDistributed,
      totalWithdrawalsPaid
    });

  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json({
      totalUsers: 0,
      pendingWithdrawals: 0,
      pendingPlanRequests: 0,
      totalEarningsDistributed: 0,
      totalWithdrawalsPaid: 0
    });
  }
}
