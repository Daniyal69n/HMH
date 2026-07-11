import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import UserInvestment from '@/models/UserInvestment';

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return Response.json({ message: 'User ID is required' }, { status: 400 });
    }
    
    // Find the user (excluding base64 profilePicture for speed)
    const user = await User.findOne({ phone: userId }).select('-profilePicture');
    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }
    
    // Get Level A members (direct referrals)
    const levelAMembers = await User.find({ referredBy: user.phone }).select('-profilePicture');
    const levelAPhones = levelAMembers.map(m => m.phone);
 
    // Get Level B members (indirect referrals)
    const levelBMembers = levelAPhones.length > 0 
      ? await User.find({ referredBy: { $in: levelAPhones } }).select('-profilePicture')
      : [];
    const levelBPhones = levelBMembers.map(m => m.phone);
 
    // Get Level C members (downline referrals)
    const levelCMembers = levelBPhones.length > 0
      ? await User.find({ referredBy: { $in: levelBPhones } }).select('-profilePicture')
      : [];

    // Calculate actual earnings per level from Transaction history
    const Transaction = (await import('@/models/Transaction')).default;
    const commissions = await Transaction.find({
      userId: user.phone,
      type: 'referral_income',
      status: 'approved'
    });

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

    const totalMembers = levelAMembers.length + levelBMembers.length + levelCMembers.length;
    const totalTeamEarnings = user.referralCommission || 0;

    return Response.json({
      totalMembers,
      totalTeamEarnings,
      earnings: {
        levelA: earningsLevelA,
        levelB: earningsLevelB,
        levelC: earningsLevelC,
        total: earningsLevelA + earningsLevelB + earningsLevelC
      },
      levelA: {
        count: levelAMembers.length,
        members: levelAMembers.map(member => {
          const activePlan = (member.investmentPlans || []).reverse().find(p => p.status === 'active');
          return {
            name: member.name,
            phone: member.phone,
            email: member.email,
            balance: member.balance,
            earnBalance: member.earnBalance,
            joinDate: member.createdAt,
            plan: activePlan ? activePlan.planName : 'Free'
          };
        })
      },
      levelB: {
        count: levelBMembers.length,
        members: levelBMembers.map(member => {
          const activePlan = (member.investmentPlans || []).reverse().find(p => p.status === 'active');
          return {
            name: member.name,
            phone: member.phone,
            email: member.email,
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
            balance: member.balance,
            earnBalance: member.earnBalance,
            joinDate: member.createdAt,
            plan: activePlan ? activePlan.planName : 'Free'
          };
        })
      }
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('Team data error:', error.message);
    console.error('Full error:', error);
    return Response.json({ 
      message: 'Internal server error', 
      error: error.message 
    }, { status: 500 });
  }
} 