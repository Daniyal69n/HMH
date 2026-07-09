import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function POST(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the user
    const user = await User.findOne({ phone: userId });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get team members (Level A only)
    // Get team members by referred relationship
    const levelAMembers = await User.find({ referredBy: user.phone });
    const levelAPhones = levelAMembers.map(m => m.phone);
    const levelBMembers = levelAPhones.length > 0 ? await User.find({ referredBy: { $in: levelAPhones } }) : [];
    const levelBPhones = levelBMembers.map(m => m.phone);
    const levelCMembers = levelBPhones.length > 0 ? await User.find({ referredBy: { $in: levelBPhones } }) : [];

    // Get active plan price of the user under test
    const { getUserActivePlanPrice } = await import('@/lib/commission');
    const userPlanPrice = await getUserActivePlanPrice(user);

    let levelAIncome = 0;
    let levelBIncome = 0;
    let levelCIncome = 0;

    // Direct (Level A): user gets 20% if user has any active plan
    if (userPlanPrice > 0) {
      for (const member of levelAMembers) {
        const memberTransactions = await Transaction.find({ userId: member.phone, status: 'completed' });
        const activity = memberTransactions.reduce((sum, tx) => (tx.type === 'recharge' || tx.type === 'withdraw') ? sum + tx.amount : sum, 0);
        levelAIncome += activity * 0.20;
      }
    }

    // Indirect (Level B): user gets 5% if user has any active plan
    if (userPlanPrice > 0) {
      for (const member of levelBMembers) {
        const memberTransactions = await Transaction.find({ userId: member.phone, status: 'completed' });
        const activity = memberTransactions.reduce((sum, tx) => (tx.type === 'recharge' || tx.type === 'withdraw') ? sum + tx.amount : sum, 0);
        levelBIncome += activity * 0.05;
      }
    }

    // Downline (Level C): user gets 5% if user has plan >= $40
    if (userPlanPrice >= 40) {
      for (const member of levelCMembers) {
        const memberTransactions = await Transaction.find({ userId: member.phone, status: 'completed' });
        const activity = memberTransactions.reduce((sum, tx) => (tx.type === 'recharge' || tx.type === 'withdraw') ? sum + tx.amount : sum, 0);
        levelCIncome += activity * 0.05;
      }
    }

    const totalTeamIncome = levelAIncome + levelBIncome + levelCIncome;

    return NextResponse.json({
      message: 'Team commission calculation test completed',
      user: {
        phone: user.phone,
        name: user.name,
        currentBalance: user.balance,
        currentEarnBalance: user.earnBalance,
        currentReferralCommission: user.referralCommission,
        currentTotalCommissionEarned: user.totalCommissionEarned,
        activePlanPriceUSD: userPlanPrice
      },
      teamStructure: {
        levelA: {
          count: levelAMembers.length,
          members: levelAMembers.map(m => ({ phone: m.phone, name: m.name }))
        },
        levelB: {
          count: levelBMembers.length,
          members: levelBMembers.map(m => ({ phone: m.phone, name: m.name }))
        },
        levelC: {
          count: levelCMembers.length,
          members: levelCMembers.map(m => ({ phone: m.phone, name: m.name }))
        }
      },
      commissionCalculation: {
        levelAIncome: levelAIncome,
        levelBIncome: levelBIncome,
        levelCIncome: levelCIncome,
        totalTeamIncome: totalTeamIncome
      },
      commissionRates: {
        levelA: '20%',
        levelB: '5%',
        levelC: '5%'
      }
    });

  } catch (error) {
    console.error('Team commission test error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 