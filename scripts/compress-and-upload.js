/**
 * Compress and upload oversized images
 * Uses sharp to compress images to under 9MB before uploading
 */

const sharp = require('sharp');
const { v2: cloudinary } = require('cloudinary');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Files that failed due to size limit
const FAILED_FILES = [
    { path: 'webphotos/Random Photos/IMG_2551.JPG', album: 'Random Photos' },
    { path: 'webphotos/Random Photos/IMG_6215.JPG', album: 'Random Photos' },
];

const TARGET_SIZE_MB = 9;
const TARGET_SIZE_BYTES = TARGET_SIZE_MB * 1024 * 1024;

async function compressImage(inputPath) {
    const tempPath = path.join('/tmp', `compressed_${Date.now()}_${path.basename(inputPath)}`);

    // Start with quality 80, reduce if needed
    let quality = 80;
    let buffer;

    while (quality >= 20) {
        buffer = await sharp(inputPath)
            .jpeg({ quality, mozjpeg: true })
            .toBuffer();

        if (buffer.length <= TARGET_SIZE_BYTES) {
            break;
        }
        quality -= 10;
    }

    // If still too large, resize
    if (buffer.length > TARGET_SIZE_BYTES) {
        const metadata = await sharp(inputPath).metadata();
        const scale = Math.sqrt(TARGET_SIZE_BYTES / buffer.length);
        const newWidth = Math.floor(metadata.width * scale);

        buffer = await sharp(inputPath)
            .resize(newWidth)
            .jpeg({ quality: 70, mozjpeg: true })
            .toBuffer();
    }

    await fs.promises.writeFile(tempPath, buffer);
    return { tempPath, size: buffer.length };
}

async function uploadImage(filePath, album, originalName) {
    const folderPath = `mba-cohort/gallery/${album.replace(/\s+/g, '-').toLowerCase()}`;

    const result = await cloudinary.uploader.upload(filePath, {
        folder: folderPath,
        transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
        resource_type: 'image',
    });

    const { error } = await supabase
        .from('gallery')
        .insert({
            album_name: album,
            image_url: result.secure_url,
            caption: path.basename(originalName, path.extname(originalName)).replace(/[-_]/g, ' '),
        });

    if (error) throw error;
    return result;
}

async function main() {
    console.log('🗜️  Compress and Upload Large Images\n');

    for (const file of FAILED_FILES) {
        const fullPath = path.join(process.cwd(), file.path);
        const originalSize = fs.statSync(fullPath).size;

        console.log(`\n📷 ${path.basename(file.path)}`);
        console.log(`   Original: ${(originalSize / 1024 / 1024).toFixed(1)}MB`);

        try {
            // Compress
            process.stdout.write('   Compressing... ');
            const { tempPath, size } = await compressImage(fullPath);
            console.log(`✅ ${(size / 1024 / 1024).toFixed(1)}MB`);

            // Upload
            process.stdout.write('   Uploading... ');
            await uploadImage(tempPath, file.album, file.path);
            console.log('✅');

            // Cleanup temp file
            fs.unlinkSync(tempPath);
        } catch (err) {
            console.log(`❌ ${err.message}`);
        }
    }

    console.log('\n✅ Done!');
}

main().catch(console.error);
