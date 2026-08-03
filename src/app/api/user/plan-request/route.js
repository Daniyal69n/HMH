import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

// POST — submit a plan purchase request with screenshot URL
// Note: Frontend MUST upload screenshot to Cloudinary first via /api/user/plan-screenshot-upload/
export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { userPhone, planName, amount, paymentMethod, screenshotUrl, trxId } = body

    if (!userPhone || !planName) {
      return NextResponse.json({ message: 'User phone and plan name are required' }, { status: 400 })
    }

    if (!trxId || !trxId.trim()) {
      return NextResponse.json({ message: 'TRX ID / Reference ID is required' }, { status: 400 })
    }

    const cleanedTrxId = trxId.trim()

    if (cleanedTrxId.length < 8 || cleanedTrxId.length > 30) {
      return NextResponse.json({ message: 'TRX ID must be between 8 and 30 characters long' }, { status: 400 })
    }

    // Check uniqueness across all users' investmentPlans (case-insensitive)
    const existingUserWithTrx = await User.findOne({
      'investmentPlans.trxId': { $regex: new RegExp(`^${cleanedTrxId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    })

    if (existingUserWithTrx) {
      return NextResponse.json({ message: 'This TRX ID has already been used. Please enter a valid unique TRX ID.' }, { status: 400 })
    }

    let finalScreenshotUrl = screenshotUrl || null;
    if (screenshotUrl && screenshotUrl.startsWith('data:image')) {
      const { uploadBase64ToCloudinary } = await import('@/lib/cloudinaryHelper');
      const cUrl = await uploadBase64ToCloudinary(screenshotUrl, 'plan-requests');
      if (cUrl) {
        finalScreenshotUrl = cUrl;
      }
    }

    // Find user
    const user = await User.findOne({ phone: userPhone })
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Add a pending investment plan record to the user
    user.investmentPlans = user.investmentPlans || []
    user.investmentPlans.push({
      planName: planName,
      amount: parseFloat(amount) || 0,
      trxId: cleanedTrxId,
      status: 'pending',
      startDate: new Date(),
      paymentMethod: paymentMethod,
      screenshotData: finalScreenshotUrl
    })

    await user.save()

    return NextResponse.json({
      message: 'Plan request submitted successfully. Admin will review and activate your plan.',
      planName,
      amount,
      paymentMethod,
      trxId: cleanedTrxId
    })
  } catch (error) {
    console.error('Plan request error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
