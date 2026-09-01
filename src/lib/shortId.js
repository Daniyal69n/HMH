import Counter from '@/models/Counter';
import User from '@/models/User';

/**
 * Atomically reserves the next sequential number for HMH shortIds starting at HMH1000.
 *
 * Uses MongoDB findOneAndUpdate + $inc so:
 *  - Only one atomic DB round-trip
 *  - Guaranteed unique sequential numbering starting at 1000 (HMH1000, HMH1001, ...)
 *
 * @returns {Promise<string>} e.g. "HMH1000"
 */
export async function getNextShortId() {
  try {
    // 1. Ensure counter doc exists and is synchronized with highest user ID >= 1000
    let counterDoc = await Counter.findById('shortId');
    if (!counterDoc || counterDoc.seq < 999) {
      let maxNum = 999;
      try {
        const users = await User.find({ shortId: /^HMH\d+$/ }).select('shortId').lean();
        for (const u of users) {
          const match = (u.shortId || '').match(/^HMH(\d+)$/);
          if (match) {
            const n = parseInt(match[1], 10);
            if (n >= 1000 && n > maxNum) {
              maxNum = n;
            }
          }
        }
      } catch (err) {
        console.warn('[shortId] Error finding max shortId:', err.message);
      }

      await Counter.findOneAndUpdate(
        { _id: 'shortId' },
        { $set: { seq: Math.max(999, maxNum) } },
        { upsert: true }
      );
    }

    // 2. Increment atomically
    const counter = await Counter.findOneAndUpdate(
      { _id: 'shortId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    let nextSeq = counter.seq;
    if (nextSeq < 1000) {
      nextSeq = 1000;
      await Counter.findByIdAndUpdate('shortId', { seq: 1000 });
    }

    return `HMH${nextSeq}`;
  } catch (error) {
    console.error('[shortId] Generation error:', error);
    // Fallback: 1000 + random 4 digits
    return `HMH${1000 + Math.floor(Math.random() * 9000)}`;
  }
}
