import mongoose from 'mongoose';

/**
 * Counter model — one document per named counter.
 * Used for atomic, race-condition-safe sequential ID generation.
 *
 * Document shape:
 *   { _id: "shortId", seq: 1042 }
 *
 * findOneAndUpdate with $inc + upsert guarantees each call gets a unique
 * number, even under concurrent serverless invocations.
 */
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },   // counter name, e.g. "shortId"
  seq: { type: Number, default: 999 }       // starts at 999 so first $inc yields 1000
});

const Counter =
  mongoose.models.Counter || mongoose.model('Counter', counterSchema);

export default Counter;
