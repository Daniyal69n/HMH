import Counter from '@/models/Counter';

/**
 * Atomically reserves the next sequential number for HMH shortIds.
 *
 * Uses MongoDB findOneAndUpdate + $inc + upsert so:
 *  - Only one DB round-trip (no scan, no loop)
 *  - Concurrent serverless calls each get a unique number (no race condition)
 *  - Counter is created starting at seq=999 on first call,
 *    so the first returned value is 1000 → "HMH1000"
 *
 * @returns {Promise<string>} e.g. "HMH1000"
 */
export async function getNextShortId() {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'shortId' },                   // filter: find our counter doc
    { $inc: { seq: 1 } },                 // atomically increment
    {
      upsert: true,                        // create if it doesn't exist yet
      new: true,                           // return the updated document
      setDefaultsOnInsert: true,           // apply schema default (seq: 999) on insert
    }
  );

  return `HMH${counter.seq}`;
}
