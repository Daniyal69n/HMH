require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const { connectDB } = require('./src/lib/mongodb');
const SystemSettings = require('./src/models/SystemSettings');

async function test() {
  try {
    await connectDB();
    const cycle = await SystemSettings.findOne({ key: 'mystery_box_cycle' }).lean();
    console.log(JSON.stringify(cycle.value.winners, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
test();
