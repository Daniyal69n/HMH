import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Static method to get setting
systemSettingsSchema.statics.getSetting = async function(key, defaultValue = null) {
  const setting = await this.findOne({ key });
  return setting ? setting.value : defaultValue;
};

// Static method to set setting
systemSettingsSchema.statics.setSetting = async function(key, value, description = '') {
  return await this.findOneAndUpdate(
    { key },
    { value, description },
    { upsert: true, new: true }
  );
};

const SystemSettings = mongoose.models.SystemSettings || mongoose.model('SystemSettings', systemSettingsSchema);

export default SystemSettings; 