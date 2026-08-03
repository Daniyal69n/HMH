import { connectDB } from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import User from '@/models/User';

export async function GET(request) {
  try {
    console.time("connectDB");
    await connectDB();
    console.timeEnd("connectDB");
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit')) || 100;
    
    let query = {};
    
    if (userId) {
      // Find user to map both phone number and database ObjectId
      const userDoc = await User.findOne({
        $or: [
          { phone: userId },
          { email: userId },
          { _id: userId.match(/^[0-9a-fA-F]{24}$/) ? userId : null }
        ].filter(Boolean)
      }).lean();

      if (userDoc) {
        query.userId = { $in: [userDoc.phone, String(userDoc._id), userDoc.email].filter(Boolean) };
      } else {
        query.userId = userId;
      }
    }
    
    if (type) {
      query.type = type;
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    console.time("query1");
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    console.timeEnd("query1");

    // Enrich transactions with user email, plan, and name
    const userIds = [...new Set(transactions.map(t => t.userId))].filter(Boolean);
    const objectIds = userIds.filter(id => typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/));

    const users = await User.find({
      $or: [
        { phone: { $in: userIds } },
        { email: { $in: userIds } },
        { _id: { $in: objectIds } }
      ]
    }).select('name phone email investmentPlans').lean();

    const userMap = {};
    users.forEach(u => {
      let activePlanName = 'No Plan';
      if (u.investmentPlans && Array.isArray(u.investmentPlans)) {
        const active = [...u.investmentPlans].reverse().find(p => p.status === 'active');
        if (active && active.planName) {
          activePlanName = active.planName;
        }
      }

      const userInfo = {
        name: u.name || '',
        email: u.email || '',
        planName: activePlanName
      };

      if (u.phone) userMap[u.phone] = userInfo;
      if (u.email) userMap[u.email] = userInfo;
      if (u._id) userMap[u._id.toString()] = userInfo;
    });

    const enrichedTransactions = transactions.map(t => {
      const info = userMap[t.userId] || {};
      return {
        ...t,
        userEmail: info.email || t.userEmail || '',
        userPlan: info.planName || t.userPlan || 'No Plan',
        userName: t.userName || info.name || 'Unknown User',
        userProfilePicture: ''
      };
    });
    console.timeEnd("processing");
    
    console.time("response");
    const res = Response.json(enrichedTransactions, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    console.timeEnd("response");
    return res;
    
  } catch (error) {
    console.warn('Transaction fetch connection failed (offline mode):', error.message);
    return Response.json([]);
  }
}

export async function POST(request) {
  try {
    await connectDB();
    
    const transactionData = await request.json();
    
    // Validate required fields
    if (!transactionData.userId || !transactionData.amount || !transactionData.type) {
      return Response.json({ message: 'User ID, amount, and type are required' }, { status: 400 });
    }
    
    // Check if user exists
    const user = await User.findOne({ phone: transactionData.userId });
    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }
    
    // Create transaction object
    const transactionObject = {
      userId: transactionData.userId,
      userName: user.name || 'Unknown User', // Use actual user name from database
      type: transactionData.type,
      amount: transactionData.amount,
      status: transactionData.status || 'pending',
      description: transactionData.description || `${transactionData.type} transaction`,
      paymentMethod: transactionData.paymentMethod,
      paymentAccountName: transactionData.paymentAccountName,
      paymentNumber: transactionData.paymentNumber,
      withdrawalMethod: transactionData.withdrawalMethod,
      withdrawalAccountName: transactionData.withdrawalAccountName,
      withdrawalNumber: transactionData.withdrawalNumber,
      userTransactionId: transactionData.transactionId || null
    };
    
    // Create transaction
    const transaction = await Transaction.create(transactionObject);
    
    return Response.json(transaction);
    
  } catch (error) {
    console.error('Transaction creation error:', error.message);
    return Response.json({ 
      message: 'Internal server error',
      error: error.message 
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    
    const { transactionId, action, ...updateData } = await request.json();
    
    console.log('Transaction approval request:', { transactionId, action });
    
    if (!transactionId || !action) {
      return Response.json({ message: 'Transaction ID and action are required' }, { status: 400 });
    }
    
    let transaction = await Transaction.findOne({ transactionId });
    if (!transaction) {
      return Response.json({ message: 'Transaction not found' }, { status: 404 });
    }
    
    console.log('Found transaction:', { 
      type: transaction.type, 
      amount: transaction.amount, 
      status: transaction.status,
      userId: transaction.userId 
    });
    
    switch (action) {
      case 'approve':
        transaction.status = 'approved';
        
        // Update user balance when transaction is approved
        const user = await User.findOne({ phone: transaction.userId });
        if (user) {
          // Ensure totalRecharge field exists and is a number
          if (user.totalRecharge === undefined || user.totalRecharge === null) {
            user.totalRecharge = 0;
          }
          
          console.log('User found before update:', {
            phone: user.phone,
            balance: user.balance,
            totalRecharge: user.totalRecharge,
            balanceType: typeof user.balance,
            totalRechargeType: typeof user.totalRecharge
          });
          
          if (transaction.type === 'recharge') {
            // For recharge: add to balance and totalRecharge when approved
            const currentBalance = typeof user.balance === 'number' ? user.balance : 0;
            const currentTotalRecharge = typeof user.totalRecharge === 'number' ? user.totalRecharge : 0;
            
            user.balance = currentBalance + transaction.amount;
            user.totalRecharge = currentTotalRecharge + transaction.amount;
          } else if (transaction.type === 'withdraw') {
            // For withdrawal: balance was already deducted when user submitted the request
            // Reset team commission if the withdrawal included it
            const currentReferralCommission = typeof user.referralCommission === 'number' ? user.referralCommission : 0;
            
            if (transaction.amount >= currentReferralCommission && currentReferralCommission > 0) {
              user.referralCommission = 0;
              user.totalCommissionEarned = Math.max(0, (user.totalCommissionEarned || 0) - currentReferralCommission);
            }

            // Sync user.withdrawHistory status
            if (user.withdrawHistory && Array.isArray(user.withdrawHistory)) {
              const item = user.withdrawHistory.find(w => 
                (w._id && w._id.toString() === transaction._id.toString()) || 
                w.transactionId === transaction.transactionId || 
                (w.amount === transaction.amount && w.status === 'pending')
              );
              if (item) {
                item.status = 'approved';
              }
            }
          }
          
          await user.save();
        }
        break;
        
      case 'reject':
        transaction.status = 'rejected';
        if (body.reason || body.adminRemarks) {
          transaction.adminRemarks = body.reason || body.adminRemarks;
        }
        
        // For rejected withdrawals, refund the balance back to user
        if (transaction.type === 'withdraw') {
          const user = await User.findOne({ phone: transaction.userId });
          if (user) {
            const currentBalance = typeof user.balance === 'number' ? user.balance : 0;
            const newBalance = currentBalance + transaction.amount;
            user.balance = newBalance;
            
            if (user.withdrawHistory && Array.isArray(user.withdrawHistory)) {
              const item = user.withdrawHistory.find(w => 
                (w._id && w._id.toString() === transaction._id.toString()) || 
                w.transactionId === transaction.transactionId || 
                (w.amount === transaction.amount && w.status === 'pending')
              );
              if (item) {
                item.status = 'rejected';
                item.adminRemarks = transaction.adminRemarks;
              }
            }
            await user.save();
          }
        }
        break;
        
      case 'update':
        Object.assign(transaction, updateData);
        break;
        
      default:
        return Response.json({ message: 'Invalid action' }, { status: 400 });
    }
    
    await transaction.save();
    
    console.log('Transaction updated successfully:', { 
      transactionId: transaction.transactionId, 
      status: transaction.status 
    });
    
    return Response.json(transaction);
    
  } catch (error) {
    console.error('Transaction update error:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
} 
