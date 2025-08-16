import { connectDB } from '@/lib/mongodb';
import InvestmentPlan from '@/models/InvestmentPlan';
import SystemSettings from '@/models/SystemSettings';
import Coupon from '@/models/Coupon';
import User from '@/models/User';

export async function GET() {
  try {
    await connectDB();
    
    // Update all existing users to ensure they have totalRecharge field
    const result = await User.updateMany(
      { totalRecharge: { $exists: false } },
      { $set: { totalRecharge: 0 } }
    );
    
    console.log(`Updated ${result.modifiedCount} users with totalRecharge field`);
    
    return Response.json({ 
      message: 'Database initialized successfully',
      usersUpdated: result.modifiedCount
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    return Response.json({ error: 'Database initialization failed' }, { status: 500 });
  }
}

export async function POST() {
  try {
    await connectDB();
    
    // Initialize default investment plans
    const defaultPlans = [
      {
        name: 'Neo Earner Type R',
        image: 'car1.jpeg',
        investAmount: '$5,000',
        dailyIncome: '$25',
        validity: '200 days',
        color: 'from-red-500 to-red-700',
        description: 'High performance variant with turbocharged engine',
        isActive: true
      },
      {
        name: 'Neo Earner Sedan',
        image: 'car2.jpeg',
        investAmount: '$3,500',
        dailyIncome: '$17.50',
        validity: '200 days',
        color: 'from-blue-500 to-blue-700',
        description: 'Classic four-door model with excellent fuel economy',
        isActive: true
      },
      {
        name: 'Neo Earner Hatchback',
        image: 'car3.jpeg',
        investAmount: '$4,000',
        dailyIncome: '$20',
        validity: '200 days',
        color: 'from-green-500 to-green-700',
        description: 'Versatile hatchback with sporty styling and ample cargo space',
        isActive: true
      },
      {
        name: 'Neo Earner Si',
        image: 'car4.jpeg',
        investAmount: '$4,500',
        dailyIncome: '$22.50',
        validity: '200 days',
        color: 'from-yellow-500 to-yellow-700',
        description: 'Sport-injected model with enhanced performance features',
        isActive: true
      },
      {
        name: 'Neo Earner Hybrid',
        image: 'car5.jpeg',
        investAmount: '$4,200',
        dailyIncome: '$21',
        validity: '200 days',
        color: 'from-purple-500 to-purple-700',
        description: 'Eco-friendly hybrid with excellent fuel efficiency',
        isActive: false
      }
    ];

    // Check if plans already exist
    const existingPlans = await InvestmentPlan.countDocuments();
    if (existingPlans === 0) {
      await InvestmentPlan.insertMany(defaultPlans);
      console.log('Default investment plans created');
    }

    // Initialize default payment details
    const defaultPaymentDetails = {
      easypaisa: { number: '03001234567', accountName: 'Neo Earner' },
      jazzcash: { number: '03001234567', accountName: 'Neo Earner' }
    };

    await SystemSettings.setSetting('paymentDetails', defaultPaymentDetails, 'Payment method details');
    console.log('Default payment details created');

    // Initialize default coupons
    const defaultCoupons = [
      {
        code: 'WELCOME100',
        bonusAmount: 100,
        maxUsage: 50,
        description: 'Welcome bonus for new users',
        isActive: true
      },
      {
        code: 'BONUS50',
        bonusAmount: 50,
        maxUsage: 100,
        description: 'General bonus coupon',
        isActive: true
      }
    ];

    // Check if coupons already exist
    const existingCoupons = await Coupon.countDocuments();
    if (existingCoupons === 0) {
      await Coupon.insertMany(defaultCoupons);
      console.log('Default coupons created');
    }

    return Response.json({ 
      success: true, 
      message: 'Database initialized successfully',
      plansCreated: existingPlans === 0,
      couponsCreated: existingCoupons === 0
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    return Response.json({ success: false, error: 'Failed to initialize database' }, { status: 500 });
  }
} 