import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const BUCKET = 'gallery'
const DATA_TABLE = 'gallery_items'

async function readGallery() {
  try {
    const { data, error } = await supabase
      .from(DATA_TABLE)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { items: data || [] }
  } catch (e) {
    console.error('Failed to read gallery:', e)
    return { items: [] }
  }
}

async function writeGalleryItem(item: any) {
  try {
    const { data, error } = await supabase
      .from(DATA_TABLE)
      .insert([item])
      .select()

    if (error) throw error
    return data?.[0]
  } catch (e) {
    console.error('Failed to write gallery item:', e)
    throw e
  }
}

export async function GET() {
  try {
    const gallery = await readGallery()
    return NextResponse.json(gallery)
  } catch (err: any) {
    console.error('GET /api/gallery error', err)
    return NextResponse.json({ items: [] })
  }
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      // Handle video URL submission
      const body = await req.json()
      const { type, url, caption, id } = body

      if (type !== 'video' || !url) {
        return NextResponse.json({ error: 'Invalid video data' }, { status: 400 })
      }

      const newItem = {
        id: id || Date.now(),
        type: 'video',
        url,
        caption: caption || 'Video',
        duration: '',
        created_at: new Date().toISOString(),
      }

      const item = await writeGalleryItem(newItem)
      return NextResponse.json(item, { status: 201 })
    } else {
      // Handle file upload (image) with Supabase Storage
      const formData = await req.formData()
      const file = formData.get('file') as File
      const caption = formData.get('caption') as string
      const type = formData.get('type') as string

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      }

      // Generate unique filename
      const timestamp = Date.now()
      const ext = file.name.split('.').pop() || 'jpg'
      const filename = `${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`

      // Upload to Supabase Storage
      const bytes = await file.arrayBuffer()
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filename, Buffer.from(bytes), {
          contentType: file.type,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
      }

      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(filename)

      // Save metadata to database
      const newItem = {
        id: timestamp,
        type: type || 'image',
        url: publicUrl.publicUrl,
        caption: caption || 'Untitled',
        storage_path: filename,
        created_at: new Date().toISOString(),
      }

      const item = await writeGalleryItem(newItem)
      return NextResponse.json(item, { status: 201 })
    }
  } catch (err: any) {
    console.error('POST /api/gallery error', err)
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { itemId } = await req.json()

    if (!itemId) {
      return NextResponse.json({ error: 'No itemId provided' }, { status: 400 })
    }

    // Read gallery to find the item
    const gallery = await readGallery()
    const item = gallery.items.find((i: any) => i.id === itemId)

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Delete file from storage if it exists
    if (item.storage_path) {
      const { error: deleteError } = await supabase.storage
        .from(BUCKET)
        .remove([item.storage_path])

      if (deleteError) {
        console.error('Storage delete error:', deleteError)
        // Continue anyway - still delete from database
      }
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from(DATA_TABLE)
      .delete()
      .eq('id', itemId)

    if (dbError) {
      console.error('Database delete error:', dbError)
      return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('DELETE /api/gallery error', err)
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}
