import { connectDB } from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import Product from '@/models/Product';

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { phone, productId, deliveryAddress, phoneNumber, paymentMethod, receiptImage } = body;

    if (!phone || !productId || !deliveryAddress || !phoneNumber) {
      return Response.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const orderPaymentMethod = paymentMethod === 'online_transfer' ? 'online_transfer' : 'balance';

    const user = await User.findOne({ phone });
    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return Response.json({ message: 'Product not found or inactive' }, { status: 404 });
    }

    // Check balance if payment method is 'balance'
    if (orderPaymentMethod === 'balance') {
      if ((user.balance || 0) < product.price) {
        return Response.json({ message: 'Insufficient balance to place this order' }, { status: 400 });
      }
    }

    // Determine active plan
    const activePlan = (user.investmentPlans || []).reverse().find(p => p.status === 'active');
    const planName = activePlan ? activePlan.planName : 'Free';

    const order = await Order.create({
      userId: user.phone,
      userName: user.name,
      userEmail: user.email || '',
      userPlan: planName,
      productId: product._id,
      productName: product.name,
      amount: product.price,
      currency: product.currency,
      deliveryAddress,
      phoneNumber,
      paymentMethod: orderPaymentMethod,
      receiptImage: receiptImage || ''
    });

    return Response.json({ message: 'Order placed successfully. Awaiting admin approval.', order }, { status: 201 });
  } catch (error) {
    console.error('Order Error:', error);
    return Response.json({ message: 'Error placing order', error: error.message }, { status: 500 });
  }
}
