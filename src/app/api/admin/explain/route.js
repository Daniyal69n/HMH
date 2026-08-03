import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const db = mongoose.connection.db;
    const transactions = await db.collection('transactions')
      .find({ type: { $in: ['referral_income', 'referral_commission', 'referral'] } })
      .limit(30)
      .toArray();

    return NextResponse.json({ success: true, transactions });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
