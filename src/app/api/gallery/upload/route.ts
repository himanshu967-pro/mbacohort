import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@/lib/supabase/server';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user profile for name
        const { data: profile } = await supabase
            .from('users')
            .select('name')
            .eq('id', user.id)
            .single();

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const album = formData.get('album') as string || 'Random Photos';
        const caption = formData.get('caption') as string || '';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Convert file to base64 for Cloudinary upload
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        const dataUri = `data:${file.type};base64,${base64}`;

        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(dataUri, {
            folder: `mba-cohort/gallery/${album.replace(/\s+/g, '-').toLowerCase()}`,
            transformation: [
                { quality: 'auto:good', fetch_format: 'auto' }
            ],
            resource_type: 'image',
        });

        // Generate thumbnail URL
        const thumbnailUrl = cloudinary.url(uploadResult.public_id, {
            transformation: [
                { width: 400, height: 400, crop: 'fill', quality: 'auto', fetch_format: 'auto' }
            ]
        });

        // Save to Supabase - only insert columns that exist
        const { data: galleryEntry, error: dbError } = await supabase
            .from('gallery')
            .insert({
                album_name: album,
                image_url: uploadResult.secure_url,
                caption: caption,
            })
            .select()
            .single();

        if (dbError) {
            console.error('Database insert error:', dbError);
            // If DB insert fails, delete from Cloudinary
            await cloudinary.uploader.destroy(uploadResult.public_id);
            throw dbError;
        }

        return NextResponse.json({
            success: true,
            image: galleryEntry,
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload image' },
            { status: 500 }
        );
    }
}
