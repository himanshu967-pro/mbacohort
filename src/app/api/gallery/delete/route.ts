import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@/lib/supabase/server';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { imageId, publicId } = await request.json();

        if (!imageId) {
            return NextResponse.json({ error: 'Image ID required' }, { status: 400 });
        }

        // Check if user owns this image or is admin
        const { data: image, error: fetchError } = await supabase
            .from('gallery')
            .select('uploaded_by, public_id')
            .eq('id', imageId)
            .single();

        if (fetchError || !image) {
            return NextResponse.json({ error: 'Image not found' }, { status: 404 });
        }

        // Check if user is admin
        const { data: userProfile } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (image.uploaded_by !== user.id && !userProfile?.is_admin) {
            return NextResponse.json({ error: 'Not authorized to delete this image' }, { status: 403 });
        }

        // Delete from Cloudinary
        if (image.public_id || publicId) {
            await cloudinary.uploader.destroy(image.public_id || publicId);
        }

        // Delete from Supabase
        const { error: deleteError } = await supabase
            .from('gallery')
            .delete()
            .eq('id', imageId);

        if (deleteError) {
            throw deleteError;
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json(
            { error: 'Failed to delete image' },
            { status: 500 }
        );
    }
}
