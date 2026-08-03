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
      const totalStart = Date.now();

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

      const pipeline = [
        { $match: stage1Match },
        { $unwind: { path: '$investmentPlans', preserveNullAndEmptyArrays: false } },
        { $match: stage3Match },
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

      // Aggregation Query
      const aggStart = Date.now();
      const results = await User.aggregate(pipeline);
      metrics.aggregationTimeMs = Date.now() - aggStart;

      // Unique Users & Plans
      metrics.uniqueUsersCount = new Set(results.map(r => String(r._id))).size;
      metrics.plansCount = results.length;

      // Screenshot statistics
      let base64Count = 0;
      let cloudinaryCount = 0;
      let omittedCount = 0;

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
        
        // Categorize screenshot data types
        if (!receiptUrl) {
          omittedCount++;
        } else if (typeof receiptUrl === 'string' && receiptUrl.startsWith('data:image')) {
          base64Count++;
        } else if (typeof receiptUrl === 'string' && receiptUrl.includes('cloudinary')) {
          cloudinaryCount++;
        } else {
          omittedCount++;
        }

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

      // Sorting Step
      const sortStart = Date.now();
      planRequests.sort((a, b) => {
        const timeA = a.startDate !== '-' ? new Date(a.startDate).getTime() : 0;
        const timeB = b.startDate !== '-' ? new Date(b.startDate).getTime() : 0;
        return timeB - timeA;
      });
      metrics.sortingTimeMs = Date.now() - sortStart;

      // JSON Serialization Step
      const serializeStart = Date.now();
      const jsonPayload = JSON.stringify(planRequests);
      metrics.serializationTimeMs = Date.now() - serializeStart;

      metrics.sizeKb = (Buffer.byteLength(jsonPayload, 'utf8') / 1024).toFixed(2);
      metrics.totalExecutionTimeMs = Date.now() - totalStart;
      
      metrics.screenshotStats = {
        base64Count,
        cloudinaryCount,
        omittedCount
      };

      report[statusParam] = metrics;
    }

    return NextResponse.json({ success: true, report });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message, stack: error.stack }, { status: 500 });
  }
}
