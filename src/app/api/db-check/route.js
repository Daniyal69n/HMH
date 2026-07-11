import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Product from '@/models/Product';
import Order from '@/models/Order';
import SystemSettings from '@/models/SystemSettings';

export const dynamic = 'force-dynamic';

export async function GET() {
  const diagnostic = {};
  try {
    console.log('Connecting via db-check...');
    await connectDB();
    diagnostic.connection = 'Success';

    try {
      const usersCount = await User.countDocuments();
      diagnostic.users = `Success (${usersCount} users)`;
    } catch (e) {
      diagnostic.users = `Failed: ${e.message}\n${e.stack}`;
    }

    try {
      const productsCount = await Product.countDocuments();
      diagnostic.products = `Success (${productsCount} products)`;
    } catch (e) {
      diagnostic.products = `Failed: ${e.message}\n${e.stack}`;
    }

    try {
      const ordersCount = await Order.countDocuments();
      diagnostic.orders = `Success (${ordersCount} orders)`;
    } catch (e) {
      diagnostic.orders = `Failed: ${e.message}\n${e.stack}`;
    }

    try {
      const mysteryBoxesEnabled = await SystemSettings.getSetting('admin_mystery_boxes_enabled', true);
      diagnostic.systemSettings = `Success (mysteryBoxesEnabled = ${mysteryBoxesEnabled})`;
    } catch (e) {
      diagnostic.systemSettings = `Failed: ${e.message}\n${e.stack}`;
    }

    return Response.json({
      success: true,
      diagnostic
    });
  } catch (error) {
    console.error('db-check overall failed:', error);
    return Response.json({
      success: false,
      message: 'Database connection failed!',
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
