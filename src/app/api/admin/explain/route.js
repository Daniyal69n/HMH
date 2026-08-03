import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET() {
  const report = {};
  try {
    await connectDB();

    const statusParam = 'all'; // Test the slowest case

    let stage1Match = { 'investmentPlans.0': { $exists: true } };
    let stage3Match = { 'investmentPlans': { $ne: null } };

    // Test 1: $match only
    const t1Start = Date.now();
    const t1Results = await User.aggregate([
      { $match: stage1Match }
    ]);
    const t1Time = Date.now() - t1Start;

    // Test 2: $match + $project
    const t2Start = Date.now();
    const t2Results = await User.aggregate([
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
    ]);
    const t2Time = Date.now() - t2Start;

    // Test 3: $match + $unwind
    const t3Start = Date.now();
    const t3Results = await User.aggregate([
      { $match: stage1Match },
      {
        $unwind: {
          path: '$investmentPlans',
          preserveNullAndEmptyArrays: false
        }
      }
    ]);
    const t3Time = Date.now() - t3Start;

    // Test 4: $match + $unwind + $match
    const t4Start = Date.now();
    const t4Results = await User.aggregate([
      { $match: stage1Match },
      {
        $unwind: {
          path: '$investmentPlans',
          preserveNullAndEmptyArrays: false
        }
      },
      { $match: stage3Match }
    ]);
    const t4Time = Date.now() - t4Start;

    // Test 5: Full pipeline
    const t5Start = Date.now();
    const t5Results = await User.aggregate([
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
    ]);
    const t5Time = Date.now() - t5Start;

    // Measure serialization and mapping times on full results
    const mapStart = Date.now();
    const planRequests = (t5Results || []).map(item => {
      if (!item || !item.plan || typeof item.plan !== 'object') return null;
      const user = item;
      const plan = item.plan;

      const pStatus = String(plan.status || 'pending').toLowerCase();
      let displayStatus = 'pending';
      if (pStatus === 'active' || pStatus === 'approved') {
        displayStatus = 'approved';
      } else if (pStatus === 'cancelled' || pStatus === 'rejected') {
        displayStatus = 'rejected';
      }

      let formattedDate = '-';
      if (plan.startDate) {
        try {
          const d = new Date(plan.startDate);
          if (!isNaN(d.getTime())) {
            formattedDate = d.toISOString().split('T')[0];
          }
        } catch { }
      }

      let receiptUrl = plan.screenshotData || plan.screenshotUrl || null;
      if (receiptUrl && typeof receiptUrl === 'string' && (receiptUrl.startsWith('data:image') || receiptUrl.length > 500)) {
        receiptUrl = null;
      }
      if (!receiptUrl) {
        receiptUrl = 'No Screenshot';
      }

      return {
        userId: user._id ? String(user._id) : '',
        userName: user.name || 'Unknown User',
        userPhone: user.phone || '',
        userEmail: user.email || '',
        userProfilePicture: user.profilePicture || '',
        planId: plan._id ? String(plan._id) : (plan.id ? String(plan.id) : Math.random().toString()),
        planName: plan.planName || 'Plan',
        userCurrentPlan: plan.planName || 'Plan',
        amount: plan.amount || 0,
        status: displayStatus,
        startDate: formattedDate,
        paymentMethod: plan.paymentMethod || 'N/A',
        trxId: plan.trxId || '',
        screenshotData: receiptUrl
      };
    }).filter(Boolean);
    const mapTime = Date.now() - mapStart;

    const sortStart = Date.now();
    planRequests.sort((a, b) => {
      const timeA = a.startDate !== '-' ? new Date(a.startDate).getTime() : 0;
      const timeB = b.startDate !== '-' ? new Date(b.startDate).getTime() : 0;
      return timeB - timeA;
    });
    const sortTime = Date.now() - sortStart;

    const serializeStart = Date.now();
    const jsonPayload = JSON.stringify(planRequests);
    const serializeTime = Date.now() - serializeStart;

    return NextResponse.json({
      success: true,
      timings: {
        test1_matchOnlyMs: t1Time,
        test2_matchProjectMs: t2Time,
        test3_matchUnwindMs: t3Time,
        test4_matchUnwindMatchMs: t4Time,
        test5_fullPipelineMs: t5Time,
        javascriptMappingMs: mapTime,
        javascriptSortingMs: sortTime,
        jsonSerializationMs: serializeTime
      },
      documentCounts: {
        test1_docs: t1Results.length,
        test2_docs: t2Results.length,
        test3_docs: t3Results.length,
        test4_docs: t4Results.length,
        test5_docs: t5Results.length
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message, stack: error.stack }, { status: 500 });
  }
}
