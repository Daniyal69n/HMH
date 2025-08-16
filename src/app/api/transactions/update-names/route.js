import { connectDB } from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import User from '@/models/User';

export async function POST(request) {
  try {
    await connectDB();
    
    // Find all transactions that have 'Unknown User' or missing userName
    const transactions = await Transaction.find({
      $or: [
        { userName: { $exists: false } },
        { userName: null },
        { userName: 'Unknown User' },
        { userName: '' }
      ]
    });
    
    let updatedCount = 0;
    
    for (const transaction of transactions) {
      // Find the user by userId (phone number)
      const user = await User.findOne({ phone: transaction.userId });
      
      if (user && user.name) {
        // Update the transaction with the user's name
        await Transaction.findByIdAndUpdate(transaction._id, {
          userName: user.name
        });
        updatedCount++;
      }
    }
    
    return Response.json({ 
      message: `Updated ${updatedCount} transactions with user names`,
      updatedCount 
    });
    
  } catch (error) {
    console.error('Error updating transaction names:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
} 