import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

// POST — submit a plan purchase request with screenshot
export async function POST(request) {
  try {
    await connectDB()

    const formData = await request.formData()
    const userPhone = formData.get('userPhone')
    const planName = formData.get('planName')
    const amount = formData.get('amount')
    const paymentMethod = formData.get('paymentMethod')
    const screenshot = formData.get('screenshot')

    if (!userPhone || !planName) {
      return NextResponse.json({ message: 'User phone and plan name are required' }, { status: 400 })
    }

    // Find user
    const user = await User.findOne({ phone: userPhone })
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Convert screenshot to base64 if provided
    let screenshotData = null
    if (screenshot && typeof screenshot === 'object' && screenshot.arrayBuffer) {
      const buffer = await screenshot.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      const mimeType = screenshot.type || 'image/jpeg'
      screenshotData = `data:${mimeType};base64,${base64}`
    }

    // Add a pending investment plan record to the user
    user.investmentPlans = user.investmentPlans || []
    user.investmentPlans.push({
      planName: planName,
      amount: parseFloat(amount) || 0,
      status: 'pending',
      startDate: new Date(),
      paymentMethod: paymentMethod,
      screenshotData: screenshotData
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
