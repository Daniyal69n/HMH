import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

// POST — submit a plan purchase request with screenshot URL
// Note: Frontend MUST upload screenshot to Cloudinary first via /api/user/plan-screenshot-upload/
export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { userPhone, planName, amount, paymentMethod, screenshotUrl } = body

    if (!userPhone || !planName) {
      return NextResponse.json({ message: 'User phone and plan name are required' }, { status: 400 })
    }

    // screenshotUrl must be a Cloudinary URL (not base64)
    if (screenshotUrl && !screenshotUrl.startsWith('http')) {
      return NextResponse.json({ message: 'Screenshot must be a valid URL (uploaded to Cloudinary)' }, { status: 400 })
    }

    // Find user
    const user = await User.findOne({ phone: userPhone })
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Add a pending investment plan record to the user (NO base64, only URLs)
    user.investmentPlans = user.investmentPlans || []
    user.investmentPlans.push({
      planName: planName,
      amount: parseFloat(amount) || 0,
      status: 'pending',
      startDate: new Date(),
      paymentMethod: paymentMethod,
      screenshotData: screenshotUrl || null  // Store ONLY Cloudinary URL, never base64
    })

    await user.save()

    return NextResponse.json({
      message: 'Plan request submitted successfully. Admin will review and activate your plan.',
      planName,
      amount,
      paymentMethod
    })
  } catch (error) {
    console.error('Plan request error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
