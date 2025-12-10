/**
 * Bulk Upload Script for Gallery Photos
 * 
 * This script uploads all images from a folder to Cloudinary
 * and saves metadata to Supabase.
 * 
 * Usage: node scripts/bulk-upload-gallery.js
 */

const { v2: cloudinary } = require('cloudinary');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Supabase (using service role for bulk operations)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Configuration
const SOURCE_FOLDER = path.join(__dirname, '..', 'webphotos');
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic'];

// Album mapping based on folder names
const FOLDER_TO_ALBUM = {
    'College Infrastructure': 'College Infrastructure',
    'Committees': 'Committees',
    'Random Photos': 'Random Photos',
    'Events': 'Events',
};

async function getImageFiles(dir, albumName = 'Random Photos') {
    const files = [];

    if (!fs.existsSync(dir)) {
        console.error(`Directory not found: ${dir}`);
        return files;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            // Use folder name as album if it matches
            const folderAlbum = FOLDER_TO_ALBUM[entry.name] || entry.name;
            const subFiles = await getImageFiles(fullPath, folderAlbum);
            files.push(...subFiles);
        } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (SUPPORTED_EXTENSIONS.includes(ext)) {
                files.push({
                    path: fullPath,
                    name: entry.name,
                    album: albumName,
                });
            }
        }
    }

    return files;
}

async function uploadImage(file) {
    const folderPath = `mba-cohort/gallery/${file.album.replace(/\s+/g, '-').toLowerCase()}`;

    try {
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(file.path, {
            folder: folderPath,
            transformation: [
                { quality: 'auto:good', fetch_format: 'auto' }
            ],
            resource_type: 'image',
        });

        // Save to Supabase (using only existing columns from original schema)
        // Original schema: id, album_name, image_url, caption, uploaded_by, created_at
        const { data, error } = await supabase
            .from('gallery')
            .insert({
                album_name: file.album,
                image_url: result.secure_url,
                caption: path.basename(file.name, path.extname(file.name)).replace(/[-_]/g, ' '),
                // uploaded_by requires a valid user UUID, leaving null for bulk upload
            })
            .select()
            .single();

        if (error) throw error;

        return { success: true, file: file.name, data };
    } catch (error) {
        return { success: false, file: file.name, error: error.message };
    }
}

async function main() {
    console.log('🖼️  Gallery Bulk Upload Script\n');
    console.log(`📁 Source: ${SOURCE_FOLDER}`);
    console.log('');

    // Check environment variables
    if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
        console.error('❌ Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in .env.local');
        process.exit(1);
    }
    if (!process.env.CLOUDINARY_API_KEY) {
        console.error('❌ Missing CLOUDINARY_API_KEY in .env.local');
        process.exit(1);
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL in .env.local');
        process.exit(1);
    }

    // Get all image files
    console.log('🔍 Scanning for images...');
    const files = await getImageFiles(SOURCE_FOLDER);

    if (files.length === 0) {
        console.log('❌ No images found!');
        process.exit(1);
    }

    console.log(`✅ Found ${files.length} images\n`);

    // Group by album for display
    const byAlbum = files.reduce((acc, f) => {
        acc[f.album] = (acc[f.album] || 0) + 1;
        return acc;
    }, {});

    console.log('📊 Albums breakdown:');
    for (const [album, count] of Object.entries(byAlbum)) {
        console.log(`   - ${album}: ${count} images`);
    }
    console.log('');

    // Upload each file
    console.log('⬆️  Starting upload...\n');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = `[${i + 1}/${files.length}]`;

        process.stdout.write(`${progress} Uploading ${file.name}... `);

        const result = await uploadImage(file);

        if (result.success) {
            console.log('✅');
            successCount++;
        } else {
            console.log(`❌ ${result.error}`);
            errorCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Upload Complete!');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log('='.repeat(50));
}

main().catch(console.error);
