import { connectDB } from '@/lib/mongodb';
import SystemSettings from '@/models/SystemSettings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const details = await SystemSettings.getSetting('ecommerce_bank_details', {
      bankName: 'SadaPay',
      accountName: 'Admin Name',
      accountNumber: '03001234567'
    });
    return Response.json(details);
  } catch (error) {
    return Response.json({ message: 'Error fetching ecommerce settings', error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { bankName, accountName, accountNumber } = body;

    const details = { bankName, accountName, accountNumber };
    await SystemSettings.setSetting('ecommerce_bank_details', details, 'Bank details for E-commerce online transfers');

    return Response.json({ message: 'Settings updated successfully', details });
  } catch (error) {
    return Response.json({ message: 'Error updating ecommerce settings', error: error.message }, { status: 500 });
  }
}
