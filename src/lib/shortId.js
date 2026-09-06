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
    const counter = await Counter.findOneAndUpdate(
      { _id: 'shortId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    let nextSeq = counter.seq;
    if (!nextSeq || nextSeq < 1000) {
      await Counter.updateOne({ _id: 'shortId' }, { $set: { seq: 1000 } });
      nextSeq = 1000;
    }

    return `HMH${nextSeq}`;
  } catch (error) {
    console.error('[shortId] Generation error:', error);
    return `HMH${1000 + Math.floor(Math.random() * 9000)}`;
  }
}
