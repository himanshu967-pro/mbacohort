/**
 * Bulk Upload Resumes to Golden CV Repository
 * 
 * Uploads resumes from local folders to Supabase storage and creates database records.
 * Matches candidate names from filenames to users in the database.
 * Folder structure: RESUMES/{COMPANY_NAME}/{CANDIDATE_RESUME}.pdf
 * 
 * Usage:
 *   node scripts/bulk-upload-resumes.js --dry-run    # Preview without uploading
 *   node scripts/bulk-upload-resumes.js              # Actually upload
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURATION
// ============================================

const SUPABASE_URL = 'https://toyylgwekkcvorwiceas.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRveXlsZ3dla2tjdm9yd2ljZWFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI5MTcyNSwiZXhwIjoyMDgwODY3NzI1fQ.Ma2xDvpdFcaA7Lz-s2VuWlOwg-JmjQRPN-m1pqYu24A';

const RESUMES_FOLDER = path.join(__dirname, '..', 'RESUMES');
const STORAGE_BUCKET = 'resumes';

// ============================================
// Initialize Supabase Client
// ============================================

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// ============================================
// Utility Functions
// ============================================

function normalizeString(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function calculateNameSimilarity(name1, name2) {
    const n1 = normalizeString(name1);
    const n2 = normalizeString(name2);

    if (n1 === n2) return 1;

    const words1 = n1.split(' ').filter(w => w.length > 1);
    const words2 = n2.split(' ').filter(w => w.length > 1);

    if (words1.length === 0 || words2.length === 0) return 0;

    let commonWords = 0;
    for (const w1 of words1) {
        for (const w2 of words2) {
            if (w1 === w2 || w1.includes(w2) || w2.includes(w1)) {
                commonWords++;
                break;
            }
        }
    }

    return commonWords / Math.max(words1.length, words2.length);
}

// Extract candidate name from filename
// Pattern: "Copy of FIRSTNAME_LASTNAME_ROLLNUMBER.pdf" or similar
function extractNameFromFilename(filename) {
    // Remove "Copy of " prefix
    let name = filename.replace(/^Copy of /i, '');

    // Remove file extension
    name = name.replace(/\.pdf$/i, '');

    // Handle special patterns like "Debleena Roy _ IIM Indore - HSBC"
    // Extract name before special separators like ' _' or ' - IIM'
    if (name.includes(' _') || name.includes(' IIM')) {
        const match = name.match(/^([a-zA-Z\s]+?)[\s_-]+(?:IIM|Pre\s+Sales|Resume)/i);
        if (match) {
            name = match[1].trim();
        }
    }

    // Handle patterns like "AtulPatel_2025EPGP018_Pre Sales..."
    // Split by underscore and take first part, then add spaces between camelCase
    const firstPart = name.split('_')[0];
    if (firstPart && /^[A-Z][a-z]+[A-Z]/.test(firstPart)) {
        // CamelCase like "AtulPatel" -> "Atul Patel"
        name = firstPart.replace(/([a-z])([A-Z])/g, '$1 $2');
    } else {
        // Remove roll number pattern (e.g., _2025EPGP003)
        name = name.replace(/_\d{4}EPGP\d{3}.*$/i, '');

        // Remove company suffixes that might be in filename
        name = name.replace(/_ACCENTURE.*$/i, '');
    }

    // Replace underscores with spaces
    name = name.replace(/_/g, ' ');

    // Trim and normalize spacing
    name = name.replace(/\s+/g, ' ').trim();

    return name;
}

// Map company folder names to clean target company names
function normalizeCompanyName(folderName) {
    const mappings = {
        'ACCENTURE ATCI': 'Accenture ATCI',
        'ACCENTURE OPERATIONS RESUME': 'Accenture Operations',
        'ACCENTURE STRATEGY': 'Accenture Strategy',
        'ACCENTURE TC': 'Accenture TC',
        'AXIS': 'Axis Bank',
        'HSBC': 'HSBC',
        'PERSISTENT': 'Persistent'
    };

    return mappings[folderName.toUpperCase()] || folderName;
}

// Guess domain based on company and role
function guessDomain(targetCompany) {
    const company = targetCompany.toLowerCase();

    if (company.includes('operations')) return 'Operations';
    if (company.includes('strategy')) return 'Consulting';
    if (company.includes('bank') || company.includes('hsbc') || company.includes('axis')) return 'Finance';
    if (company.includes('persistent')) return 'Technology';
    if (company.includes('atci') || company.includes('tc')) return 'Consulting';

    return 'Consulting'; // Default for MBA roles
}

// ============================================
// Database Operations
// ============================================

async function loadAllUsers() {
    const { data, error } = await supabase
        .from('users')
        .select('id, name, email');

    if (error) {
        console.error('Error loading users:', error);
        return [];
    }

    console.log(`👥 Loaded ${data.length} users from database\n`);
    return data;
}

function findMatchingUser(candidateName, users) {
    let bestMatch = null;
    let bestScore = 0;

    for (const user of users) {
        const score = calculateNameSimilarity(candidateName, user.name);
        if (score > bestScore) {
            bestScore = score;
            bestMatch = user;
        }
    }

    // Require at least 50% match
    if (bestScore >= 0.5) {
        return { user: bestMatch, score: bestScore };
    }

    return null;
}

async function checkExistingResume(userId, targetCompany) {
    const { data, error } = await supabase
        .from('resumes')
        .select('id')
        .eq('user_id', userId)
        .ilike('target_company', `%${targetCompany.split(' ')[0]}%`)
        .limit(1);

    if (error) return false;
    return data && data.length > 0;
}

async function uploadFileToStorage(filePath, filename) {
    const fileBuffer = fs.readFileSync(filePath);
    const uniqueFilename = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(uniqueFilename, fileBuffer, {
            contentType: 'application/pdf',
            upsert: false
        });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(uniqueFilename);

    return urlData.publicUrl;
}

async function insertResume(userId, name, domain, targetCompany, fileUrl) {
    const { data, error } = await supabase
        .from('resumes')
        .insert({
            user_id: userId,
            name: name,
            domain: domain,
            target_company: targetCompany,
            file_url: fileUrl
        })
        .select('id');

    if (error) throw error;
    return data[0];
}

// ============================================
// Main Function
// ============================================

async function runBulkUpload(dryRun = false) {
    console.log('\n' + '='.repeat(60));
    console.log('📄 BULK UPLOAD RESUMES TO GOLDEN CV');
    console.log('='.repeat(60));
    console.log(`Mode: ${dryRun ? '🔍 DRY RUN (no changes will be made)' : '💾 LIVE UPLOAD'}`);
    console.log('='.repeat(60) + '\n');

    // Load users
    const users = await loadAllUsers();

    // Check if RESUMES folder exists
    if (!fs.existsSync(RESUMES_FOLDER)) {
        console.error(`❌ RESUMES folder not found at: ${RESUMES_FOLDER}`);
        return;
    }

    // Get all company folders
    const companyFolders = fs.readdirSync(RESUMES_FOLDER).filter(f => {
        const folderPath = path.join(RESUMES_FOLDER, f);
        return fs.statSync(folderPath).isDirectory();
    });

    console.log(`📂 Found ${companyFolders.length} company folders\n`);

    // Collect all resumes
    const allResumes = [];

    for (const company of companyFolders) {
        const companyPath = path.join(RESUMES_FOLDER, company);
        const files = fs.readdirSync(companyPath).filter(f => f.toLowerCase().endsWith('.pdf'));

        const targetCompany = normalizeCompanyName(company);
        const domain = guessDomain(targetCompany);

        console.log(`  ${company}/`);
        console.log(`  → Target Company: ${targetCompany}`);
        console.log(`  → Domain: ${domain}`);
        console.log(`  → Files: ${files.length}`);

        for (const file of files) {
            const candidateName = extractNameFromFilename(file);
            allResumes.push({
                filePath: path.join(companyPath, file),
                filename: file,
                candidateName,
                targetCompany,
                domain
            });
        }
        console.log('');
    }

    console.log(`\n📊 Total resumes to process: ${allResumes.length}\n`);

    // Statistics
    const stats = {
        total: allResumes.length,
        matched: 0,
        unmatched: 0,
        duplicates: 0,
        uploaded: 0,
        errors: 0
    };

    const unmatchedCandidates = [];

    console.log('-'.repeat(60));
    console.log('PROCESSING RESUMES');
    console.log('-'.repeat(60) + '\n');

    for (let i = 0; i < allResumes.length; i++) {
        const resume = allResumes[i];
        console.log(`\n[${i + 1}/${allResumes.length}] ${resume.candidateName}`);
        console.log(`  File: ${resume.filename}`);
        console.log(`  Company: ${resume.targetCompany}`);

        // Find matching user
        const match = findMatchingUser(resume.candidateName, users);

        if (!match) {
            console.log(`  ❌ No matching user found`);
            stats.unmatched++;
            unmatchedCandidates.push(resume.candidateName);
            continue;
        }

        console.log(`  ✓ Matched to: ${match.user.name} (${(match.score * 100).toFixed(0)}% match)`);
        stats.matched++;

        // Check for duplicates
        if (!dryRun) {
            const exists = await checkExistingResume(match.user.id, resume.targetCompany);
            if (exists) {
                console.log(`  ⚠️  Already has resume for ${resume.targetCompany}, skipping`);
                stats.duplicates++;
                continue;
            }
        }

        if (dryRun) {
            console.log(`  📝 Would upload resume`);
            console.log(`     → Domain: ${resume.domain}`);
            console.log(`     → Target: ${resume.targetCompany}`);
        } else {
            try {
                // Upload to storage
                console.log(`  ⬆️  Uploading to storage...`);
                const fileUrl = await uploadFileToStorage(resume.filePath, resume.filename);

                // Insert into database
                await insertResume(
                    match.user.id,
                    match.user.name,
                    resume.domain,
                    resume.targetCompany,
                    fileUrl
                );

                console.log(`  ✅ Uploaded successfully`);
                stats.uploaded++;
            } catch (error) {
                console.log(`  ❌ Error: ${error.message}`);
                stats.errors++;
            }
        }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('UPLOAD SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total resumes processed:   ${stats.total}`);
    console.log(`Users matched:             ${stats.matched}`);
    console.log(`Users not found:           ${stats.unmatched}`);
    console.log(`Duplicates skipped:        ${stats.duplicates}`);
    console.log(`Successfully uploaded:     ${stats.uploaded}`);
    console.log(`Errors:                    ${stats.errors}`);
    console.log('='.repeat(60) + '\n');

    if (unmatchedCandidates.length > 0) {
        console.log('⚠️  Unmatched candidates (check name format):');
        [...new Set(unmatchedCandidates)].forEach(name => {
            console.log(`   - ${name}`);
        });
        console.log('');
    }

    if (dryRun) {
        console.log('💡 This was a dry run. To actually upload, run without --dry-run flag.');
    }
}

// ============================================
// CLI Entry Point
// ============================================

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('-d');

runBulkUpload(dryRun).catch(console.error);
