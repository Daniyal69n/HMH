import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const trxId = searchParams.get('trxId');

    if (!trxId || !trxId.trim()) {
      return NextResponse.json({ exists: false, validLength: true });
    }

    const cleaned = trxId.trim();

    if (cleaned.length < 8 || cleaned.length > 30) {
      return NextResponse.json({
        exists: false,
        validLength: false,
        message: 'TRX ID must be between 8 and 30 characters long'
      });
    }

    await connectDB();

    const existingUser = await User.findOne({
      'investmentPlans.trxId': { $regex: new RegExp(`^${cleaned.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    }).select('_id').lean();

    return NextResponse.json({
      exists: !!existingUser,
      validLength: true
    });
  } catch (error) {
    console.error('Check TRX ID error:', error);
    return NextResponse.json({ exists: false, error: error.message }, { status: 500 });
  }
}
