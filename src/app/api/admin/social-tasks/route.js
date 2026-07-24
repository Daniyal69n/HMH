import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    await connectDB();
    const users = await User.find({
      'socialTaskSubmissions': { $exists: true, $not: { $size: 0 } }
    }, 'name email phone socialTaskSubmissions').lean();

    const usersWithSubmissions = users.map(user => {
      return {
        name: user.name,
        email: user.email,
        phone: user.phone,
        submissions: user.socialTaskSubmissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
      };
    }).sort((a, b) => {
      const latestA = a.submissions.length > 0 ? new Date(a.submissions[0].submittedAt) : new Date(0);
      const latestB = b.submissions.length > 0 ? new Date(b.submissions[0].submittedAt) : new Date(0);
      return latestB - latestA;
    });

    return Response.json({ users: usersWithSubmissions });
  } catch (error) {
    console.error('Error fetching social tasks:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { phone, submissionId, status, adminRemarks } = body;

    if (!phone || !submissionId || !status) {
      return Response.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    const submission = user.socialTaskSubmissions.id(submissionId);
    if (!submission) {
      return Response.json({ message: 'Submission not found' }, { status: 404 });
    }

    submission.status = status;
    submission.adminRemarks = adminRemarks || '';

    user.markModified('socialTaskSubmissions');
    await user.save();

    return Response.json({ message: 'Submission updated successfully' });
  } catch (error) {
    console.error('Error updating social task:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
