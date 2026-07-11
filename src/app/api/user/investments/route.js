import { connectDB } from '@/lib/mongodb';
import UserInvestment from '@/models/UserInvestment';
import User from '@/models/User';
import InvestmentPlan from '@/models/InvestmentPlan';

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const active = searchParams.get('active');
    
    let query = {};
    
    if (userId) {
      query.userId = userId;
    }
    
    if (active === 'true') {
      query.isActive = true;
    }
    
    const investments = await UserInvestment.find(query)
      .populate('planId', 'name image color')
      .sort({ createdAt: -1 })
      .lean();
    
    return Response.json(investments, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('Investment fetch error:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    
    const investmentData = await request.json();
    
    // Validate required fields
    if (!investmentData.userId || !investmentData.planId || !investmentData.investAmount) {
      return Response.json({ message: 'User ID, plan ID, and investment amount are required' }, { status: 400 });
    }
    
    // Check if user exists
    const user = await User.findOne({ phone: investmentData.userId });
    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }
    
    // Check if plan exists
    const plan = await InvestmentPlan.findById(investmentData.planId);
    if (!plan) {
      return Response.json({ message: 'Investment plan not found' }, { status: 404 });
    }
    
    // Check if user has sufficient balance
    const investAmount = parseFloat(investmentData.investAmount.replace(/[$,₹Rs]/g, '').replace(/,/g, ''));
    if (user.balance < investAmount) {
      return Response.json({ message: 'Insufficient balance' }, { status: 400 });
    }
    
    // Allow multiple active investments - removed restriction
    
    // Deduct investment amount from user balance
    user.balance -= investAmount;
    await user.save();
    
    // Create investment
    const investment = await UserInvestment.create({
      userId: investmentData.userId,
      planId: investmentData.planId,
      planName: investmentData.planName,
      investAmount: investmentData.investAmount,
      dailyIncome: investmentData.dailyIncome,
      validity: investmentData.validity,
      investDate: investmentData.investDate || new Date(),
      isActive: true,
      totalEarned: 0,
      lastIncomeDate: null,
      firstIncomeDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    });

    // Handle referral commission when someone buys a plan
    try {
      const { distributeCommission } = await import('@/lib/commission');
      await distributeCommission(user.phone, investAmount, investmentData.planName);
    } catch (commissionError) {
      console.error('Error adding referral commission:', commissionError);
      // Don't fail the investment creation if commission fails
    }
    
    return Response.json(investment);
    
  } catch (error) {
    console.error('Investment creation error:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    
    const { investmentId, ...updateData } = await request.json();
    
    if (!investmentId) {
      return Response.json({ message: 'Investment ID is required' }, { status: 400 });
    }
    
    const investment = await UserInvestment.findByIdAndUpdate(
      investmentId,
      updateData,
      { new: true }
    );
    
    if (!investment) {
      return Response.json({ message: 'Investment not found' }, { status: 404 });
    }
    
    return Response.json(investment);
    
  } catch (error) {
    console.error('Investment update error:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
} 
