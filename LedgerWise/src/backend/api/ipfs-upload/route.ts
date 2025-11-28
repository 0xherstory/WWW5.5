import { NextRequest, NextResponse } from 'next/server'
import { uploadToIPFS } from '@/utils/ipfs'

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json()

    if (!data) {
      return NextResponse.json({ error: 'Data is required' }, { status: 400 })
    }

    const cid = await uploadToIPFS(data)
    if (!cid) {
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      cid
    })
  } catch (error) {
    console.error('IPFS upload error:', error)
    return NextResponse.json({ 
      error: 'Upload failed' 
    }, { status: 500 })
  }
}
