import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import UserInvestment from '@/models/UserInvestment';

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build search query
    let searchQuery = {};
    if (search) {
      searchQuery = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Get users with pagination
    const users = await User.find(searchQuery)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalUsers = await User.countDocuments(searchQuery);

    // Get statistics
    const totalDeposits = await User.aggregate([
      { $unwind: '$rechargeHistory' },
      { $match: { 'rechargeHistory.status': 'approved' } },
      { $group: { _id: null, total: { $sum: '$rechargeHistory.amount' } } }
    ]);

    const totalWithdrawals = await User.aggregate([
      { $unwind: '$withdrawHistory' },
      { $match: { 'withdrawHistory.status': 'approved' } },
      { $group: { _id: null, total: { $sum: '$withdrawHistory.amount' } } }
    ]);

    const blockedUsers = await User.countDocuments({ isBlocked: true });
    const activeUsers = await User.countDocuments({ isBlocked: false });

    return NextResponse.json({
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNextPage: page * limit < totalUsers,
        hasPrevPage: page > 1
      },
      statistics: {
        totalDeposits: totalDeposits[0]?.total || 0,
        totalWithdrawals: totalWithdrawals[0]?.total || 0,
        blockedUsers,
        activeUsers
      }
    });

  } catch (error) {
    console.warn('Get users connection failed (offline mode):', error.message);
    return NextResponse.json({
      users: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalUsers: 0,
        hasNextPage: false,
        hasPrevPage: false
      },
      statistics: {
        totalDeposits: 0,
        totalWithdrawals: 0,
        blockedUsers: 0,
        activeUsers: 0
      }
    });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    
    const { userId, action, data } = await request.json();

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'User ID and action are required' },
        { status: 400 }
      );
    }

    let updateData = {};

    switch (action) {
      case 'block':
        updateData = { isBlocked: true };
        break;
      case 'unblock':
        updateData = { isBlocked: false };
        break;
      case 'approve':
        updateData = { status: 'approved' };
        break;
      case 'reject':
        updateData = { status: 'rejected' };
        break;
      case 'toggleBlock':
        // Find the user first to get current blocked status
        let userToToggle;
        if (userId.match(/^[0-9a-fA-F]{24}$/)) {
          userToToggle = await User.findById(userId);
        } else {
          userToToggle = await User.findOne({ phone: userId });
        }
        
        if (!userToToggle) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }
        
        updateData = { isBlocked: !userToToggle.isBlocked };
        break;
      case 'make_admin':
        updateData = { isAdmin: true };
        break;
      case 'remove_admin':
        updateData = { isAdmin: false };
        break;
      case 'update_balance':
        updateData = { balance: data.balance };
        break;
      case 'delete':
        // Delete the user and related data
        let deletedUser;
        
        // Try to find user by ID first, then by phone number
        if (userId.match(/^[0-9a-fA-F]{24}$/)) {
          // Valid ObjectId format
          deletedUser = await User.findByIdAndDelete(userId);
        } else {
          // Try to find by phone number
          deletedUser = await User.findOneAndDelete({ phone: userId });
        }
        
        if (!deletedUser) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }
        
        // Clean up related data
        try {
          // Delete user's transactions
          await Transaction.deleteMany({ userId: deletedUser.phone });
          
          // Delete user's investments
          await UserInvestment.deleteMany({ userId: deletedUser.phone });
          
          // Update team members in other users (remove this user from their team)
          await User.updateMany(
            { 'teamMembers.userId': deletedUser._id.toString() },
            { $pull: { teamMembers: { userId: deletedUser._id.toString() } } }
          );
        } catch (cleanupError) {
          console.error('Error cleaning up user data:', cleanupError);
          // Continue with deletion even if cleanup fails
        }
        
        return NextResponse.json({
          message: 'User deleted successfully',
          user: deletedUser
        });
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    let user;
    
    // Try to find and update user by ID first, then by phone number
    if (userId.match(/^[0-9a-fA-F]{24}$/)) {
      // Valid ObjectId format
      user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');
    } else {
      // Try to find by phone number
      user = await User.findOneAndUpdate(
        { phone: userId },
        updateData,
        { new: true, runValidators: true }
      ).select('-password');
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'User updated successfully',
      user
    });

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Delete the user and related data
    let deletedUser;
    
    // Try to find user by ID first, then by phone number
    if (userId.match(/^[0-9a-fA-F]{24}$/)) {
      // Valid ObjectId format
      deletedUser = await User.findByIdAndDelete(userId);
    } else {
      // Try to find by phone number
      deletedUser = await User.findOneAndDelete({ phone: userId });
    }
    
    if (!deletedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Clean up related data
    try {
      // Delete user's transactions
      await Transaction.deleteMany({ userId: deletedUser.phone });
      
      // Delete user's investments
      await UserInvestment.deleteMany({ userId: deletedUser.phone });
      
      // Update team members in other users (remove this user from their team)
      await User.updateMany(
        { 'teamMembers.userId': deletedUser._id.toString() },
        { $pull: { teamMembers: { userId: deletedUser._id.toString() } } }
      );
    } catch (cleanupError) {
      console.error('Error cleaning up user data:', cleanupError);
      // Continue with deletion even if cleanup fails
    }
    
    return NextResponse.json({
      message: 'User deleted successfully',
      user: deletedUser
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 