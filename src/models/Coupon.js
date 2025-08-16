import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  bonusAmount: {
    type: Number,
    required: true
  },
  maxUsage: {
    type: Number,
    default: null // null means unlimited
  },
  usageCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    default: ''
  },
  usedBy: [{
    userId: {
      type: String,
      ref: 'User'
    },
    usedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Check if coupon can be used
couponSchema.methods.canBeUsed = function() {
  return this.isActive && (this.maxUsage === null || this.usageCount < this.maxUsage);
};

// Use coupon
couponSchema.methods.use = function(userId) {
  if (!this.canBeUsed()) {
    throw new Error('Coupon cannot be used');
  }
  
  this.usageCount += 1;
  this.usedBy.push({ userId, usedAt: new Date() });
  return this.save();
};

const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);

export default Coupon; 