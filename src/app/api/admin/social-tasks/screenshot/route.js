import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const id = searchParams.get('id');

    if (!phone || !id) {
      return Response.json({ message: 'Missing parameters' }, { status: 400 });
    }

    const user = await User.findOne({ phone }).select('socialTaskSubmissions').lean();
    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    const submission = user.socialTaskSubmissions.find(s => s._id.toString() === id);
    if (!submission) {
      return Response.json({ message: 'Submission not found' }, { status: 404 });
    }

    return Response.json({ screenshotBase64: submission.screenshotBase64 || '' });
  } catch (error) {
    console.error('Error fetching screenshot:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
