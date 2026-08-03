import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();

    const db = mongoose.connection.db;
    const collections = await db.listCollections({ name: 'users' }).toArray();
    
    if (collections.length === 0) {
      return NextResponse.json({ success: false, error: 'users collection not found in database' }, { status: 404 });
    }

    const indexes = await db.collection('users').indexes();

    return NextResponse.json({ success: true, indexes });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message, stack: error.stack }, { status: 500 });
  }
}
