import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const testNum = parseInt(searchParams.get('test') || '1', 10);

    const stage1Match = { 'investmentPlans.0': { $exists: true } };
    const stage3Match = { 'investmentPlans': { $ne: null } };

    let pipeline = [];

    if (testNum === 1) {
      // Test 1: $match only
      pipeline = [
        { $match: stage1Match }
      ];
    } else if (testNum === 2) {
      // Test 2: $match + $project (of entire investmentPlans field to mimic simple query)
      pipeline = [
        { $match: stage1Match },
        {
          $project: {
            _id: 1,
            name: 1,
            phone: 1,
            email: 1,
            profilePicture: 1,
            investmentPlans: 1
          }
        }
      ];
    } else if (testNum === 3) {
      // Test 3: $match + $unwind
      pipeline = [
        { $match: stage1Match },
        {
          $unwind: {
            path: '$investmentPlans',
            preserveNullAndEmptyArrays: false
          }
        }
      ];
    } else if (testNum === 4) {
      // Test 4: $match + $unwind + $match
      pipeline = [
        { $match: stage1Match },
        {
          $unwind: {
            path: '$investmentPlans',
            preserveNullAndEmptyArrays: false
          }
        },
        { $match: stage3Match }
      ];
    } else if (testNum === 5) {
      // Test 5: Full pipeline (with final projection)
      pipeline = [
        { $match: stage1Match },
        {
          $unwind: {
            path: '$investmentPlans',
            preserveNullAndEmptyArrays: false
          }
        },
        { $match: stage3Match },
        {
          $project: {
            _id: 1,
            name: 1,
            phone: 1,
            email: 1,
            profilePicture: 1,
            'plan._id': '$investmentPlans._id',
            'plan.planName': '$investmentPlans.planName',
            'plan.amount': '$investmentPlans.amount',
            'plan.status': '$investmentPlans.status',
            'plan.paymentMethod': '$investmentPlans.paymentMethod',
            'plan.trxId': '$investmentPlans.trxId',
            'plan.startDate': '$investmentPlans.startDate',
            'plan.screenshotUrl': '$investmentPlans.screenshotUrl',
            'plan.screenshotData': '$investmentPlans.screenshotData'
          }
        }
      ];
    } else {
      return NextResponse.json({ success: false, error: 'Invalid test parameter. Choose 1, 2, 3, 4, or 5.' }, { status: 400 });
    }

    const start = Date.now();
    const results = await User.aggregate(pipeline);
    const executionTimeMs = Date.now() - start;

    const payload = JSON.stringify(results);
    const sizeKb = (Buffer.byteLength(payload, 'utf8') / 1024).toFixed(2);

    return NextResponse.json({
      success: true,
      test: testNum,
      executionTimeMs,
      documentsReturned: results.length,
      payloadSizeKb: parseFloat(sizeKb)
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message, stack: error.stack }, { status: 500 });
  }
}
