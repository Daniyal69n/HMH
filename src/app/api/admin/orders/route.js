import { connectDB } from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const skip = parseInt(searchParams.get('skip') || '0');
    
    // Use aggregation for faster queries with projection
    const orders = await Order.collection
      .aggregate([
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            userId: 1,
            userName: 1,
            productName: 1,
            amount: 1,
            currency: 1,
            status: 1,
            createdAt: 1,
            _id: 1
          }
        }
      ])
      .toArray();
    
    return Response.json(orders);
  } catch (error) {
    console.error('Order fetch error:', error);
    return Response.json([], { status: 200 });
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
      // Find the user and deduct balance only if paid via balance
      const user = await User.findOne({ phone: order.userId });
      if (!user) {
        return Response.json({ message: 'User not found' }, { status: 404 });
      }

      if (order.paymentMethod !== 'online_transfer') {
        if ((user.balance || 0) < order.amount) {
          return Response.json({ message: 'User has insufficient balance to approve this order.' }, { status: 400 });
        }

        user.balance -= order.amount;
        
        // Add to user's withdrawHistory in User model
        if (!user.withdrawHistory) {
          user.withdrawHistory = [];
        }
        user.withdrawHistory.push({
          amount: order.amount,
          status: 'approved',
          date: new Date()
        });

        await user.save();

        // Create a transaction log of type 'withdraw'
        const txnId = `TXN-ORDER-${Date.now()}`;
        await Transaction.create({
          transactionId: txnId,
          userId: user.phone,
          userName: user.name,
          userPhone: user.phone,
          amount: order.amount,
          type: 'withdraw',
          status: 'approved',
          description: `Purchased: ${order.productName}`,
          createdAt: new Date()
        });
      }

      // Update user's total approved purchases for reward tracking
      if (!user.totalApprovedPurchases) {
        user.totalApprovedPurchases = 0;
      }
      user.totalApprovedPurchases += order.amount;
      await user.save();
    }

    order.status = status;
    await order.save();

    return Response.json({ message: `Order successfully ${status}`, order });
  } catch (error) {
    return Response.json({ message: 'Error updating order', error: error.message }, { status: 500 });
  }
}
