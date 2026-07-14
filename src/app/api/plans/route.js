import { connectDB } from '@/lib/mongodb';
import InvestmentPlan from '@/models/InvestmentPlan';

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    
    let query = {};
    
    if (active === 'true') {
      query.isActive = true;
    }
    
    // Self-healing: if wrong Neo Earner plans exist, wipe them out so they get recreated correctly
    const wrongPlans = await InvestmentPlan.countDocuments({ name: { $regex: 'Neo Earner' } });
    if (wrongPlans > 0) {
      await InvestmentPlan.deleteMany({});
    }

    // Check if plans exist, if not create default ones
    const existingPlans = await InvestmentPlan.countDocuments();
    if (existingPlans === 0) {
      const defaultPlans = [
        {
          name: 'Basic',
          image: 'basic.png',
          investAmount: 'Rs1,500',
          dailyIncome: 'Rs50',
          validity: 'Lifetime',
          color: 'from-green-400 to-green-600',
          description: 'Perfect for Beginners',
          isActive: true,
          order: 1
        },
        {
          name: 'Standard',
          image: 'standard.png',
          investAmount: 'Rs3,000',
          dailyIncome: 'Rs100',
          validity: 'Lifetime',
          color: 'from-blue-400 to-blue-600',
          description: 'Best for Regular Earners',
          isActive: true,
          order: 2
        },
        {
          name: 'Diamond',
          image: 'diamond.png',
          investAmount: 'Rs6,000',
          dailyIncome: 'Rs200',
          validity: 'Lifetime',
          color: 'from-purple-400 to-purple-600',
          description: 'Grow Your Income Faster',
          isActive: true,
          order: 3
        },
        {
          name: 'Pro',
          image: 'pro.png',
          investAmount: 'Rs9,000',
          dailyIncome: 'Rs300',
          validity: 'Lifetime',
          color: 'from-indigo-400 to-indigo-600',
          description: 'For Serious Earners',
          isActive: true,
          order: 4
        },
        {
          name: 'Premium',
          image: 'premium.png',
          investAmount: 'Rs12,000',
          dailyIncome: 'Rs400',
          validity: 'Lifetime',
          color: 'from-red-400 to-red-600',
          description: 'Maximum Value & Benefits',
          isActive: true,
          order: 5
        },
        {
          name: 'Legend',
          image: 'legend.png',
          investAmount: 'Rs15,000',
          dailyIncome: 'Rs500',
          validity: 'Lifetime',
          color: 'from-yellow-400 to-yellow-600',
          description: 'Ultimate Membership Experience',
          isActive: true,
          order: 6
        }
      ];
      
      await InvestmentPlan.insertMany(defaultPlans);
      console.log('Default investment plans created automatically');
    }
    
    const plans = await InvestmentPlan.find(query).sort({ order: 1, name: 1 }).lean();
    
    return Response.json(plans, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.warn('Plans fetch connection failed (offline mode):', error.message);
    const defaultPlans = [
        {
          _id: 'fallback_1',
          name: 'Basic',
          image: 'basic.png',
          investAmount: 'Rs1,500',
          dailyIncome: 'Rs50',
          validity: 'Lifetime',
          color: 'from-green-400 to-green-600',
          description: 'Perfect for Beginners',
          isActive: true,
          order: 1
        },
        {
          _id: 'fallback_2',
          name: 'Standard',
          image: 'standard.png',
          investAmount: 'Rs3,000',
          dailyIncome: 'Rs100',
          validity: 'Lifetime',
          color: 'from-blue-400 to-blue-600',
          description: 'Best for Regular Earners',
          isActive: true,
          order: 2
        },
        {
          _id: 'fallback_3',
          name: 'Diamond',
          image: 'diamond.png',
          investAmount: 'Rs6,000',
          dailyIncome: 'Rs200',
          validity: 'Lifetime',
          color: 'from-purple-400 to-purple-600',
          description: 'Grow Your Income Faster',
          isActive: true,
          order: 3
        },
        {
          _id: 'fallback_4',
          name: 'Pro',
          image: 'pro.png',
          investAmount: 'Rs9,000',
          dailyIncome: 'Rs300',
          validity: 'Lifetime',
          color: 'from-indigo-400 to-indigo-600',
          description: 'For Serious Earners',
          isActive: true,
          order: 4
        },
        {
          _id: 'fallback_5',
          name: 'Premium',
          image: 'premium.png',
          investAmount: 'Rs12,000',
          dailyIncome: 'Rs400',
          validity: 'Lifetime',
          color: 'from-red-400 to-red-600',
          description: 'Maximum Value & Benefits',
          isActive: true,
          order: 5
        },
        {
          _id: 'fallback_6',
          name: 'Legend',
          image: 'legend.png',
          investAmount: 'Rs15,000',
          dailyIncome: 'Rs500',
          validity: 'Lifetime',
          color: 'from-yellow-400 to-yellow-600',
          description: 'Ultimate Membership Experience',
          isActive: true,
          order: 6
        }
    ];
    return Response.json(defaultPlans);
  }
}

export async function POST(request) {
  try {
    await connectDB();
    
    const { name, image, investAmount, dailyIncome, validity, color, description } = await request.json();
    
    if (!name || !investAmount || !dailyIncome || !validity) {
      return Response.json({ message: 'Name, investment amount, daily income, and validity are required' }, { status: 400 });
    }
    
    // Create plan
    const plan = await InvestmentPlan.create({
      name,
      image: image || 'car1.jpeg',
      investAmount,
      dailyIncome,
      validity,
      color: color || 'from-purple-500 to-purple-700',
      description: description || '',
      isActive: true
    });
    
    return Response.json({ plan });
    
  } catch (error) {
    console.error('Plan creation error:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    
    const { id, ...updateData } = await request.json();
    
    if (!id) {
      return Response.json({ message: 'Plan ID is required' }, { status: 400 });
    }
    
    const plan = await InvestmentPlan.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    if (!plan) {
      return Response.json({ message: 'Plan not found' }, { status: 404 });
    }
    
    return Response.json({ plan });
    
  } catch (error) {
    console.error('Plan update error:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('id');
    
    if (!planId) {
      return Response.json({ message: 'Plan ID is required' }, { status: 400 });
    }
    
    const plan = await InvestmentPlan.findByIdAndDelete(planId);
    
    if (!plan) {
      return Response.json({ message: 'Plan not found' }, { status: 404 });
    }
    
    return Response.json({ message: 'Plan deleted successfully' });
    
  } catch (error) {
    console.error('Plan deletion error:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
} 