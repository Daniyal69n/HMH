import mongoose from 'mongoose';

const userInvestmentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InvestmentPlan',
    required: true
  },
  planName: {
    type: String,
    required: true
  },
  investAmount: {
    type: String,
    required: true
  },
  dailyIncome: {
    type: String,
    required: true
  },
  validity: {
    type: String,
    required: true
  },
  investDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalEarned: {
    type: Number,
    default: 0
  },
  lastIncomeDate: {
    type: Date,
    default: Date.now
  },
  firstIncomeDate: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

const UserInvestment = mongoose.models.UserInvestment || mongoose.model('UserInvestment', userInvestmentSchema);

export default UserInvestment; 