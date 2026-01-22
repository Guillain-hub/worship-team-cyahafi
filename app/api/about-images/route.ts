import fs from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'about');
const DATA_FILE = path.join(process.cwd(), 'data', 'about-images.json');

async function ensureDirs() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  } catch (e) {
    console.error('Failed to create directories:', e);
  }
}

async function readAboutImages() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return { items: [] };
  }
}

async function writeAboutImages(data: any) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write about images data:', e);
  }
}

export async function GET() {
  try {
    await ensureDirs();
    const aboutImages = await readAboutImages();
    return NextResponse.json(aboutImages);
  } catch (err: any) {
    console.error('GET /api/about-images error', err);
    return NextResponse.json({ items: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDirs();
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const caption = formData.get('caption') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    await fs.writeFile(filepath, Buffer.from(bytes));

    // Update about images data
    const aboutImages = await readAboutImages();
    const maxOrder = aboutImages.items.length > 0
      ? Math.max(...aboutImages.items.map((i: any) => i.order || 0))
      : 0;

    const newItem = {
      id: timestamp,
      url: `/uploads/about/${filename}`,
      caption: caption || 'Untitled',
      order: maxOrder + 1,
    };

    aboutImages.items.push(newItem);
    await writeAboutImages(aboutImages);

    return NextResponse.json(newItem, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/about-images error', err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureDirs();
    const { itemId } = await request.json();

    if (!itemId) {
      return NextResponse.json({ error: 'No itemId provided' }, { status: 400 });
    }

    // Read about images
    const aboutImages = await readAboutImages();
    const item = aboutImages.items.find((i: any) => i.id === itemId);

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Delete file
    const filename = item.url.split('/').pop();
    const filepath = path.join(UPLOAD_DIR, filename);
    try {
      await fs.unlink(filepath);
    } catch (e) {
      console.error('Failed to delete file:', e);
    }

    // Update about images data
    aboutImages.items = aboutImages.items.filter((i: any) => i.id !== itemId);
    await writeAboutImages(aboutImages);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/about-images error', err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureDirs();
    const body = await request.json();
    await writeAboutImages(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating about images:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
