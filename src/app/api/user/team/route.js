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
    
    // Find the user
    const user = await User.findOne({ phone: userId });
    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }
    
    // Get Level A members (direct referrals only)
    const levelAMembers = await User.find({ referralCode: userId });
    
    // Calculate team statistics (only Level A)
    const totalMembers = levelAMembers.length;
    
    // Use the stored referral commission instead of recalculating
    // This ensures that withdrawn commission is properly reflected
    const totalTeamEarnings = user.referralCommission || 0;
    
    return Response.json({
      totalMembers,
      totalTeamEarnings,
      levelA: {
        count: levelAMembers.length,
        members: levelAMembers.map(member => ({
          name: member.name,
          phone: member.phone,
          balance: member.balance,
          earnBalance: member.earnBalance,
          joinDate: member.createdAt
        }))
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