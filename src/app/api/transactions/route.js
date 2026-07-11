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
    
    let query = {};
    
    if (userId) {
      query.userId = userId;
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
      .limit(100)
      .lean();
    console.timeEnd("query1");

    // Enrich transactions with userProfilePicture
    const userIds = [...new Set(transactions.map(t => t.userId))];
    console.time("query2");
    const users = await User.find({ phone: { $in: userIds } }).select('phone profilePicture').lean();
    console.timeEnd("query2");
    console.time("processing");
    const userPicMap = {};
    users.forEach(u => {
      userPicMap[u.phone] = u.profilePicture || '';
    });

    const enrichedTransactions = transactions.map(t => ({
      ...t,
      userProfilePicture: userPicMap[t.userId] || ''
    }));
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
            
            console.log('Approving recharge - updating balance:', {
              currentBalance: currentBalance,
              newBalance: user.balance,
              currentTotalRecharge: currentTotalRecharge,
              newTotalRecharge: user.totalRecharge,
              amount: transaction.amount
            });
          } else if (transaction.type === 'withdraw') {
            // For withdrawal: balance was already deducted when user submitted the request
            // But we need to reset team commission if the withdrawal included it
            console.log('Approving withdrawal - balance already deducted when request was submitted');
            
            // Check if this withdrawal included team commission
            // If the withdrawal amount is greater than or equal to the user's referral commission,
            // then the team commission should be reset to 0
            const currentReferralCommission = typeof user.referralCommission === 'number' ? user.referralCommission : 0;
            
            if (transaction.amount >= currentReferralCommission && currentReferralCommission > 0) {
              // Reset team commission to 0 since it was withdrawn
              user.referralCommission = 0;
              user.totalCommissionEarned = Math.max(0, user.totalCommissionEarned - currentReferralCommission);
              
              console.log('Resetting team commission after withdrawal:', {
                withdrawalAmount: transaction.amount,
                previousReferralCommission: currentReferralCommission,
                newReferralCommission: 0
              });
            }
          }
          
          // Use findOneAndUpdate to ensure the field is properly saved
          await User.findOneAndUpdate(
            { phone: transaction.userId },
            { 
              balance: user.balance,
              totalRecharge: user.totalRecharge,
              referralCommission: user.referralCommission,
              totalCommissionEarned: user.totalCommissionEarned
            },
            { new: true }
          );
          
          // Verify the update worked
          const updatedUser = await User.findOne({ phone: transaction.userId });
          console.log('User after save:', {
            phone: updatedUser.phone,
            balance: updatedUser.balance,
            totalRecharge: updatedUser.totalRecharge,
            referralCommission: updatedUser.referralCommission,
            totalCommissionEarned: updatedUser.totalCommissionEarned,
            balanceType: typeof updatedUser.balance,
            totalRechargeType: typeof updatedUser.totalRecharge
          });
        }
        break;
        
      case 'reject':
        transaction.status = 'rejected';
        
        // For rejected withdrawals, refund the balance back to user
        if (transaction.type === 'withdraw') {
          const user = await User.findOne({ phone: transaction.userId });
          if (user) {
            const currentBalance = typeof user.balance === 'number' ? user.balance : 0;
            const newBalance = currentBalance + transaction.amount;
            
            await User.findOneAndUpdate(
              { phone: transaction.userId },
              { balance: newBalance }
            );
            
            console.log('Rejecting withdrawal - refunding balance:', {
              currentBalance: currentBalance,
              newBalance: newBalance,
              amount: transaction.amount
            });
          }
        } else {
          // For other transaction types, no balance changes needed
          console.log('Rejecting transaction - no balance change needed');
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
