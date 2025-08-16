import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return Response.json({ error: 'Phone parameter is required' }, { status: 400 });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Fix totalRecharge if it's undefined
    if (user.totalRecharge === undefined) {
      user.totalRecharge = 0;
      await user.save();
      console.log('Fixed totalRecharge for user:', phone);
    }

    console.log('Test API - User data:', {
      phone: user.phone,
      balance: user.balance,
      earnBalance: user.earnBalance,
      totalRecharge: user.totalRecharge,
      balanceType: typeof user.balance,
      earnBalanceType: typeof user.earnBalance,
      totalRechargeType: typeof user.totalRecharge
    });

    return Response.json({
      phone: user.phone,
      balance: user.balance,
      earnBalance: user.earnBalance,
      totalRecharge: user.totalRecharge,
      balanceType: typeof user.balance,
      earnBalanceType: typeof user.earnBalance,
      totalRechargeType: typeof user.totalRecharge
    });

  } catch (error) {
    console.error('Test API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
} 