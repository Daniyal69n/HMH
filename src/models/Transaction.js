import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  userName: {
    type: String,
    required: false
  },
  type: {
    type: String,
    required: true,
    enum: ['recharge', 'withdraw', 'daily_income', 'referral_income', 'coupon_redeem', 'signup_bonus']
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  // For withdraw transactions
  withdrawalMethod: {
    type: String,
    enum: ['easypaisa', 'jazzcash', 'bank', 'EasyPaisa', 'JazzCash', 'Bank']
  },
  withdrawalAccountName: {
    type: String
  },
  withdrawalAccountNumber: {
    type: String
  },
  withdrawalNumber: {
    type: String
  },
  withdrawalFee: {
    type: Number,
    default: 0
  },
  amountAfterFee: {
    type: Number,
    default: 0
  },
  // For recharge transactions
  paymentMethod: {
    type: String,
    enum: ['easypaisa', 'jazzcash', 'bank', 'EasyPaisa', 'JazzCash', 'Bank']
  },
  paymentAccountName: {
    type: String
  },
  paymentNumber: {
    type: String
  },
  userTransactionId: {
    type: String,
    default: null
  },
  // For coupon redeem
  couponCode: {
    type: String
  },
  // For referral income
  referredUser: {
    type: String,
    ref: 'User'
  },
  referralLevel: {
    type: String,
    enum: ['A', 'B', 'C']
  }
}, {
  timestamps: true
});

// Generate transaction ID
transactionSchema.pre('save', function(next) {
  if (!this.transactionId) {
    this.transactionId = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
  next();
});

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

export default Transaction; 
