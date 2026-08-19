import { connectDB } from '@/lib/mongodb';
import SystemSettings from '@/models/SystemSettings';

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    if (key) {
      // Get specific setting
      let setting = await SystemSettings.findOne({ key }).lean();
      
      // Self-healing for old payment details
      if (key === 'paymentDetails' && setting && setting.value) {
        if (setting.value.easypaisa?.accountName === 'Neo Earner' || setting.value.jazzcash?.accountName === 'Neo Earner') {
          const newPaymentDetails = {
            easypaisa: { number: '03715918754', accountName: 'Aqsa Shahid' },
            jazzcash: { number: '03715918754', accountName: 'Aqsa Shahid' },
            binance: setting.value.binance || { number: '940791290', accountName: 'Binance Pay ID' }
          };
          // Update it in DB so we don't have to do it again
          await SystemSettings.findOneAndUpdate(
            { key: 'paymentDetails' },
            { $set: { value: newPaymentDetails } }
          );
          setting.value = newPaymentDetails;
        }
      }

      return Response.json(setting, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    } else {
      // Get all settings
      const settings = await SystemSettings.find({}).lean();
      return Response.json(settings, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }
    
  } catch (error) {
    console.warn('Settings fetch connection failed (offline mode):', error.message);
    return Response.json(null);
  }
}

export async function POST(request) {
  try {
    await connectDB();
    
    const { key, value, description } = await request.json();
    
    if (!key || value === undefined) {
      return Response.json({ message: 'Key and value are required' }, { status: 400 });
    }
    
    // Create or update setting
    const setting = await SystemSettings.findOneAndUpdate(
      { key },
      { value, description: description || '' },
      { upsert: true, new: true }
    );
    
    return Response.json(setting);
    
  } catch (error) {
    console.error('Settings creation error:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    
    const { key, value, description } = await request.json();
    
    if (!key || value === undefined) {
      return Response.json({ message: 'Key and value are required' }, { status: 400 });
    }
    
    const setting = await SystemSettings.findOneAndUpdate(
      { key },
      { value, description: description || '' },
      { new: true }
    );
    
    if (!setting) {
      return Response.json({ message: 'Setting not found' }, { status: 404 });
    }
    
    return Response.json(setting);
    
  } catch (error) {
    console.error('Settings update error:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    if (!key) {
      return Response.json({ message: 'Key is required' }, { status: 400 });
    }
    
    const setting = await SystemSettings.findOneAndDelete({ key });
    
    if (!setting) {
      return Response.json({ message: 'Setting not found' }, { status: 404 });
    }
    
    return Response.json({ message: 'Setting deleted successfully' });
    
  } catch (error) {
    console.error('Settings deletion error:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
} 