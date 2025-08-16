import mongoose from 'mongoose';

const investmentPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    required: true,
    default: 'car1.jpeg'
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
  color: {
    type: String,
    required: true,
    default: 'from-purple-500 to-purple-700'
  },
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const InvestmentPlan = mongoose.models.InvestmentPlan || mongoose.model('InvestmentPlan', investmentPlanSchema);

export default InvestmentPlan; 