import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

// Create a Supabase client with service role for storage uploads
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        // Get authenticated user
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Get form data
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
        }

        // Create unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload using admin client (bypasses RLS)
        const { error: uploadError } = await supabaseAdmin.storage
            .from('profile-pictures')
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: true
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('profile-pictures')
            .getPublicUrl(filePath);

        // Update user profile with new picture URL
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({ profile_picture: publicUrl })
            .eq('id', user.id);

        if (updateError) {
            console.error('Update error:', updateError);
            return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            url: publicUrl
        });

    } catch (error) {
        console.error('Profile picture upload error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
