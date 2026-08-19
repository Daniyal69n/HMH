const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI;

const systemSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: mongoose.Schema.Types.Mixed,
  description: String,
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { strict: false });

const SystemSettings = mongoose.models.SystemSettings || mongoose.model('SystemSettings', systemSettingsSchema);

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    const newPaymentDetails = {
      easypaisa: { number: '03715918754', accountName: 'Aqsa Shahid' },
      jazzcash: { number: '03715918754', accountName: 'Aqsa Shahid' },
      binance: { number: '940791290', accountName: 'Binance Pay ID' }
    };

    const result = await SystemSettings.findOneAndUpdate(
      { key: 'paymentDetails' },
      { 
        $set: { 
          value: newPaymentDetails,
          updatedAt: new Date()
        } 
      },
      { new: true, upsert: true }
    );

    console.log('Updated payment details in DB:', JSON.stringify(result.value, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB');
  }
}

run();
