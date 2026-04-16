import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

let supabase: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      throw new Error('Missing Supabase credentials: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }

    supabase = createClient(url, key)
  }
  return supabase
}

const BUCKET = 'about-images'
const DATA_TABLE = 'about_images'

async function readAboutImages() {
  try {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from(DATA_TABLE)
      .select('*')
      .order('order', { ascending: true })

    if (error) throw error
    return { items: data || [] }
  } catch (e) {
    console.error('Failed to read about images:', e)
    return { items: [] }
  }
}

async function writeAboutImageItem(item: any) {
  try {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from(DATA_TABLE)
      .insert([item])
      .select()

    if (error) throw error
    return data?.[0]
  } catch (e) {
    console.error('Failed to write about image item:', e)
    throw e
  }
}

export async function GET() {
  try {
    const aboutImages = await readAboutImages()
    return NextResponse.json(aboutImages)
  } catch (err: any) {
    console.error('GET /api/about-images error', err)
    return NextResponse.json({ items: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const caption = formData.get('caption') as string

    console.log('POST /api/about-images - File upload request:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      caption,
    })

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Check Supabase credentials
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ 
        error: 'Server error: NEXT_PUBLIC_SUPABASE_URL not configured' 
      }, { status: 500 })
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ 
        error: 'Server error: SUPABASE_SERVICE_ROLE_KEY not configured' 
      }, { status: 500 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`

    // Upload to Supabase Storage
    const bytes = await file.arrayBuffer()
    const client = getSupabaseClient()
    
    console.log('Starting upload:', { filename, fileSize: bytes.byteLength, contentType: file.type })

    const { data: uploadData, error: uploadError } = await client.storage
      .from(BUCKET)
      .upload(filename, Buffer.from(bytes), {
        contentType: file.type,
      })

    if (uploadError) {
      console.error('Upload error details:', {
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        error: uploadError,
      })
      return NextResponse.json({ 
        error: `Upload failed: ${uploadError.message}` 
      }, { status: 500 })
    }

    console.log('Upload successful:', { filename, uploadData })

    // Get public URL
    const { data: publicUrl } = client.storage
      .from(BUCKET)
      .getPublicUrl(filename)

    // Get max order for sequencing
    const aboutImages = await readAboutImages()
    const maxOrder = aboutImages.items.length > 0
      ? Math.max(...aboutImages.items.map((i: any) => i.order || 0))
      : 0

    // Save metadata to database
    const newItem = {
      id: timestamp,
      url: publicUrl.publicUrl,
      caption: caption || 'Untitled',
      storage_path: filename,
      order: maxOrder + 1,
      created_at: new Date().toISOString(),
    }

    const item = await writeAboutImageItem(newItem)
    return NextResponse.json(item, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/about-images error:', {
      message: err?.message,
      stack: err?.stack,
      error: err,
    })
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { itemId } = await request.json()

    if (!itemId) {
      return NextResponse.json({ error: 'No itemId provided' }, { status: 400 })
    }

    // Read about images to find the item
    const aboutImages = await readAboutImages()
    const item = aboutImages.items.find((i: any) => i.id === itemId)

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Delete file from storage if it exists
    if (item.storage_path) {
      const client = getSupabaseClient()
      const { error: deleteError } = await client.storage
        .from(BUCKET)
        .remove([item.storage_path])

      if (deleteError) {
        console.error('Storage delete error:', deleteError)
        // Continue anyway - still delete from database
      }
    }

    // Delete from database
    const client = getSupabaseClient()
    const { error: dbError } = await client
      .from(DATA_TABLE)
      .delete()
      .eq('id', itemId)

    if (dbError) {
      console.error('Database delete error:', dbError)
      return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('DELETE /api/about-images error', err)
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Bulk update orders
    if (Array.isArray(body.items)) {
      const client = getSupabaseClient()
      const { error } = await client
        .from(DATA_TABLE)
        .upsert(body.items, { onConflict: 'id' })

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false }, { status: 400 })
  } catch (error) {
    console.error('Error updating about images:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
