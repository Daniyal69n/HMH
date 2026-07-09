import { connectDB } from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function GET() {
  try {
    await connectDB();
    const orders = await Order.find().sort({ createdAt: -1 });
    return Response.json(orders);
  } catch (error) {
    return Response.json({ message: 'Error fetching orders', error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !['approved', 'rejected'].includes(status)) {
      return Response.json({ message: 'Invalid order ID or status' }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return Response.json({ message: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'pending') {
      return Response.json({ message: `Order is already ${order.status}` }, { status: 400 });
    }

    if (status === 'approved') {
      // Find the user and deduct balance
      const user = await User.findOne({ phone: order.userId });
      if (!user) {
        return Response.json({ message: 'User not found' }, { status: 404 });
      }

      if ((user.balance || 0) < order.amount) {
        return Response.json({ message: 'User has insufficient balance to approve this order.' }, { status: 400 });
      }

      user.balance -= order.amount;
      await user.save();

      // Create a transaction log
      const txnId = `TXN-ORDER-${Date.now()}`;
      await Transaction.create({
        transactionId: txnId,
        userId: user.phone,
        userName: user.name,
        userPhone: user.phone,
        amount: order.amount,
        type: 'ecommerce_purchase', // specifically log this type
        status: 'approved',
        description: `Purchased: ${order.productName}`,
        createdAt: new Date()
      });
    }

    order.status = status;
    await order.save();

    return Response.json({ message: `Order successfully ${status}`, order });
  } catch (error) {
    return Response.json({ message: 'Error updating order', error: error.message }, { status: 500 });
  }
}
