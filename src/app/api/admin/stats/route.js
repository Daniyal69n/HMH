import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function GET(request) {
  try {
    await connectDB();

    // Run all database operations in parallel using raw collections (O(1) connection latency)
    const [
      totalUsers,
      pendingWithdrawals,
      usersWithPending,
      userEarnBalances,
      allWithdrawals,
      approvedWithdrawals
    ] = await Promise.all([
      User.collection.countDocuments(),
      Transaction.collection.countDocuments({
        type: 'withdraw',
        status: 'pending'
      }),
      User.collection.find({
        'investmentPlans.status': 'pending'
      }).project({ investmentPlans: 1 }).toArray(),
      User.collection.aggregate([
        { $group: { _id: null, total: { $sum: '$earnBalance' } } }
      ]).toArray(),
      Transaction.collection.aggregate([
        { $match: { type: 'withdraw' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).toArray(),
      Transaction.collection.aggregate([
        { $match: { type: 'withdraw', status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).toArray()
    ]);

    let pendingPlanRequests = 0;
    for (const u of usersWithPending) {
      pendingPlanRequests += (u.investmentPlans || []).filter(p => p.status === 'pending').length;
    }

    const totalUserEarnBalance = userEarnBalances[0]?.total || 0;
    const totalWithdrawalsAmount = allWithdrawals[0]?.total || 0;
    const totalEarningsDistributed = totalUserEarnBalance + totalWithdrawalsAmount;
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
