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
    
    // Check if plans exist, if not create default ones
    const existingPlans = await InvestmentPlan.countDocuments();
    if (existingPlans === 0) {
      const defaultPlans = [
        {
          name: 'Neo Earner Type R',
          image: 'car1.jpeg',
          investAmount: '$5,000',
          dailyIncome: '$25',
          validity: '200 days',
          color: 'from-red-500 to-red-700',
          description: 'High performance variant with turbocharged engine',
          isActive: true,
          order: 1
        },
        {
          name: 'Neo Earner Sedan',
          image: 'car2.jpeg',
          investAmount: '$3,500',
          dailyIncome: '$17.50',
          validity: '200 days',
          color: 'from-blue-500 to-blue-700',
          description: 'Classic four-door model with excellent fuel economy',
          isActive: true,
          order: 2
        },
        {
          name: 'Neo Earner Hatchback',
          image: 'car3.jpeg',
          investAmount: '$4,000',
          dailyIncome: '$20',
          validity: '200 days',
          color: 'from-green-500 to-green-700',
          description: 'Versatile hatchback with sporty styling and ample cargo space',
          isActive: true,
          order: 3
        },
        {
          name: 'Neo Earner Si',
          image: 'car4.jpeg',
          investAmount: '$4,500',
          dailyIncome: '$22.50',
          validity: '200 days',
          color: 'from-yellow-500 to-yellow-700',
          description: 'Sport-injected model with enhanced performance features',
          isActive: true,
          order: 4
        }
      ];
      
      await InvestmentPlan.insertMany(defaultPlans);
      console.log('Default investment plans created automatically');
    }
    
    const plans = await InvestmentPlan.find(query).sort({ order: 1, name: 1 });
    
    return Response.json(plans, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('Plans fetch error:', error.message);
    console.error('Full error:', error);
    return Response.json({ 
      message: 'Internal server error', 
      error: error.message 
    }, { status: 500 });
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