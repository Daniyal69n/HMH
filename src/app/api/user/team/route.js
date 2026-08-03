import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import UserInvestment from '@/models/UserInvestment';
import Transaction from '@/models/Transaction';

export async function GET(request) {
  try {
    console.time("connectDB");
    await connectDB();
    console.timeEnd("connectDB");
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return Response.json({ message: 'User ID is required' }, { status: 400 });
    }
    
    // Find the user (excluding base64 profilePicture for speed)
    console.time("query1");
    const user = await User.findOne({ phone: userId }).select('name phone customDirectReferrals customIndirectReferrals referralCommission').lean();
    console.timeEnd("query1");
    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }
    
    // Get Level A members (direct referrals with active plans)
    console.time("query2");
    const levelAMembers = await User.find({ referredBy: user.phone, 'investmentPlans.status': 'active' }).select('name phone email referredBy balance earnBalance createdAt investmentPlans.status investmentPlans.planName').lean();
    const levelAPhones = levelAMembers.map(m => m.phone);
    
    // Get Pending members (direct referrals with NO active plan)
    const pendingMembers = await User.find({ referredBy: user.phone, 'investmentPlans.status': { $ne: 'active' } }).select('name phone email referredBy balance earnBalance createdAt investmentPlans.status investmentPlans.planName').lean();
 
    // Get Level B members (indirect referrals with active plans)
    const levelBMembers = levelAPhones.length > 0 
      ? await User.find({ referredBy: { $in: levelAPhones }, 'investmentPlans.status': 'active' }).select('name phone email referredBy balance earnBalance createdAt investmentPlans.status investmentPlans.planName').lean()
      : [];
    const levelBPhones = levelBMembers.map(m => m.phone);
 
    // Get Level C members (downline referrals with active plans)
    const levelCMembers = levelBPhones.length > 0
      ? await User.find({ referredBy: { $in: levelBPhones }, 'investmentPlans.status': 'active' }).select('name phone email referredBy balance earnBalance createdAt investmentPlans.status investmentPlans.planName').lean()
      : [];

    // Map phone numbers to user full names
    const phoneToNameMap = {};
    phoneToNameMap[user.phone] = user.name || 'User';
    levelAMembers.forEach(m => { phoneToNameMap[m.phone] = m.name; });
    pendingMembers.forEach(m => { phoneToNameMap[m.phone] = m.name; });
    levelBMembers.forEach(m => { phoneToNameMap[m.phone] = m.name; });
    levelCMembers.forEach(m => { phoneToNameMap[m.phone] = m.name; });

    const missingPhones = [
      ...levelAMembers.map(m => m.referredBy),
      ...levelBMembers.map(m => m.referredBy),
      ...levelCMembers.map(m => m.referredBy),
      ...pendingMembers.map(m => m.referredBy)
    ].filter(ph => ph && !phoneToNameMap[ph]);

    if (missingPhones.length > 0) {
      const missingUsers = await User.find({ phone: { $in: missingPhones } }).select('name phone').lean();
      missingUsers.forEach(p => { phoneToNameMap[p.phone] = p.name; });
    }

    // Calculate actual earnings per level from Transaction history
    const commissions = await Transaction.find({
      userId: user.phone,
      type: 'referral_income',
      status: 'approved'
    }).lean();
    console.timeEnd("query2");
    console.time("processing");

    let earningsLevelA = 0;
    let earningsLevelB = 0;
    let earningsLevelC = 0;

    for (const tx of commissions) {
      if (tx.referralLevel === 'A') {
        earningsLevelA += tx.amount;
      } else if (tx.referralLevel === 'B') {
        earningsLevelB += tx.amount;
      } else if (tx.referralLevel === 'C') {
        earningsLevelC += tx.amount;
      }
    }

    const countA = (user.customDirectReferrals !== undefined && user.customDirectReferrals !== null) ? user.customDirectReferrals : levelAMembers.length;
    const countB = (user.customIndirectReferrals !== undefined && user.customIndirectReferrals !== null) ? user.customIndirectReferrals : levelBMembers.length;
    const totalMembers = countA + countB + levelCMembers.length;
    const totalTeamEarnings = user.referralCommission || 0;

    const responseData = {
      totalMembers,
      totalTeamEarnings,
      earnings: {
        levelA: earningsLevelA,
        levelB: earningsLevelB,
        levelC: earningsLevelC,
        total: earningsLevelA + earningsLevelB + earningsLevelC
      },
      levelA: {
        count: countA,
        members: levelAMembers.map(member => {
          const activePlan = (member.investmentPlans || []).reverse().find(p => p.status === 'active');
          return {
            name: member.name,
            phone: member.phone,
            email: member.email,
            referredBy: member.referredBy,
            referredByName: phoneToNameMap[member.referredBy] || user.name || 'Referrer',
            balance: member.balance,
            earnBalance: member.earnBalance,
            joinDate: member.createdAt,
            plan: activePlan ? activePlan.planName : 'Free'
          };
        })
      },
      levelB: {
        count: countB,
        members: levelBMembers.map(member => {
          const activePlan = (member.investmentPlans || []).reverse().find(p => p.status === 'active');
          return {
            name: member.name,
            phone: member.phone,
            email: member.email,
            referredBy: member.referredBy,
            referredByName: phoneToNameMap[member.referredBy] || 'Referrer',
            balance: member.balance,
            earnBalance: member.earnBalance,
            joinDate: member.createdAt,
            plan: activePlan ? activePlan.planName : 'Free'
          };
        })
      },
      levelC: {
        count: levelCMembers.length,
        members: levelCMembers.map(member => {
          const activePlan = (member.investmentPlans || []).reverse().find(p => p.status === 'active');
          return {
            name: member.name,
            phone: member.phone,
            email: member.email,
            referredBy: member.referredBy,
            referredByName: phoneToNameMap[member.referredBy] || 'Referrer',
            balance: member.balance,
            earnBalance: member.earnBalance,
            joinDate: member.createdAt,
            plan: activePlan ? activePlan.planName : 'Free'
          };
        })
      },
      pending: {
        count: pendingMembers.length,
        members: pendingMembers.map(member => {
          return {
            name: member.name,
            phone: member.phone,
            email: member.email,
            referredBy: member.referredBy,
            referredByName: phoneToNameMap[member.referredBy] || user.name || 'Referrer',
            balance: member.balance,
            earnBalance: member.earnBalance,
            joinDate: member.createdAt,
            plan: 'Free'
          };
        })
      }
    };
    
    console.timeEnd("processing");
    console.time("response");
    const res = Response.json(responseData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    console.timeEnd("response");
    return res;
    
  } catch (error) {
    console.error('Team data error:', error.message);
    console.error('Full error:', error);
    return Response.json({ 
      message: 'Internal server error', 
      error: error.message 
    }, { status: 500 });
  }
} 