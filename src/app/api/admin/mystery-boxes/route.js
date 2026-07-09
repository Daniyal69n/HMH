import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import SystemSettings from '@/models/SystemSettings';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectDB();
    const enabled = await SystemSettings.getSetting('admin_mystery_boxes_enabled', true);
    
    const defaultBoxes = [
      { id: 'box_1', rank: 1, medal: '🥇', title: 'Top 1 Mystery Box', desc: '$100 Cash Prize + Gold Badge',   value: 100 },
      { id: 'box_2', rank: 2, medal: '🥈', title: 'Top 2 Mystery Box', desc: '$50 Cash Prize + Silver Badge',  value: 50  },
      { id: 'box_3', rank: 3, medal: '🥉', title: 'Top 3 Mystery Box', desc: '$25 Cash Prize + Bronze Badge', value: 25  },
    ];
    
    const boxes = await SystemSettings.getSetting('admin_mystery_boxes', defaultBoxes);
    
    return NextResponse.json({ enabled, boxes });
  } catch (error) {
    console.error('Get mystery boxes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const { enabled, boxes } = await request.json();
    
    if (typeof enabled === 'boolean') {
      await SystemSettings.setSetting('admin_mystery_boxes_enabled', enabled);
    }
    if (Array.isArray(boxes)) {
      await SystemSettings.setSetting('admin_mystery_boxes', boxes);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Set mystery boxes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
