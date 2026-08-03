import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET() {
  const report = {};
  try {
    await connectDB();

    const statuses = ['pending', 'approved', 'rejected', 'all'];

    for (const statusParam of statuses) {
      const metrics = {};
      
      let stage1Match = {};
      let stage3Match = {};

      if (statusParam === 'approved') {
        stage1Match = { 'investmentPlans.status': { $in: ['active', 'approved'] } };
        stage3Match = { 'investmentPlans.status': { $in: ['active', 'approved'] } };
      } else if (statusParam === 'rejected') {
        stage1Match = { 'investmentPlans.status': { $in: ['cancelled', 'rejected'] } };
        stage3Match = { 'investmentPlans.status': { $in: ['cancelled', 'rejected'] } };
      } else if (statusParam === 'pending') {
        stage1Match = { 'investmentPlans.status': 'pending' };
        stage3Match = { 'investmentPlans.status': 'pending' };
      } else {
        stage1Match = { 'investmentPlans.0': { $exists: true } };
        stage3Match = { 'investmentPlans': { $ne: null } };
      }

      // Step 1: Measure Quick Count
      const countStart = Date.now();
      let documentCount = 0;
      try {
        const countPipeline = [
          { $match: stage1Match },
          { $unwind: { path: '$investmentPlans', preserveNullAndEmptyArrays: false } },
          { $match: stage3Match },
          { $count: 'total' }
        ];
        const countResult = await User.aggregate(countPipeline);
        documentCount = countResult[0]?.total || 0;
      } catch (e) {
        documentCount = -1; // failed to count
      }
      metrics.countTimeMs = Date.now() - countStart;
      metrics.totalDocumentsCount = documentCount;

      // Step 2: Run Aggregation with $limit: 5
      const pipelineLimit = [
        { $match: stage1Match },
        { $unwind: { path: '$investmentPlans', preserveNullAndEmptyArrays: false } },
        { $match: stage3Match },
        { $limit: 5 },
        {
          $project: {
            _id: 1,
            name: 1,
            phone: 1,
            email: 1,
            profilePicture: 1,
            plan: '$investmentPlans'
          }
        }
      ];

      const aggStart = Date.now();
      const results = await User.aggregate(pipelineLimit);
      metrics.aggregationTimeMs = Date.now() - aggStart;

      // Screenshot statistics of limited sample
      let base64Count = 0;
      let cloudinaryCount = 0;
      let omittedCount = 0;
      const samples = [];

      // Mapping Step
      const mapStart = Date.now();
      const planRequests = (results || []).map(item => {
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
        let type = 'omitted/null';
        
        // Categorize screenshot data types
        if (!receiptUrl) {
          omittedCount++;
        } else if (typeof receiptUrl === 'string' && receiptUrl.startsWith('data:image')) {
          base64Count++;
          type = 'base64 (starts with data:image)';
        } else if (typeof receiptUrl === 'string' && receiptUrl.includes('cloudinary')) {
          cloudinaryCount++;
          type = 'cloudinary url';
        } else {
          omittedCount++;
        }

        samples.push({
          planId: plan._id ? String(plan._id) : 'N/A',
          planName: plan.planName || 'Plan',
          amount: plan.amount || 0,
          screenshotDataType: type,
          screenshotLength: receiptUrl ? receiptUrl.length : 0
        });

        // Apply list sanitization to omit base64
        if (receiptUrl && typeof receiptUrl === 'string' && (receiptUrl.startsWith('data:image') || receiptUrl.length > 500)) {
          receiptUrl = null;
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
      metrics.mappingTimeMs = Date.now() - mapStart;

      // JSON Serialization Step
      const serializeStart = Date.now();
      const jsonPayload = JSON.stringify(planRequests);
      metrics.serializationTimeMs = Date.now() - serializeStart;

      metrics.sizeKb = (Buffer.byteLength(jsonPayload, 'utf8') / 1024).toFixed(2);
      
      metrics.screenshotStats = {
        base64Count,
        cloudinaryCount,
        omittedCount,
        samples
      };

      report[statusParam] = metrics;
    }

    return NextResponse.json({ success: true, report });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message, stack: error.stack }, { status: 500 });
  }
}
