/**
 * Bulk Import Interview Experiences Script
 * 
 * Parses messy CSV files from the "exp csv" folder, uses AI to clean and structure
 * the data, matches candidates to users, and imports into the database.
 * 
 * Usage:
 *   node scripts/bulk-import-experiences.js --dry-run    # Preview without importing
 *   node scripts/bulk-import-experiences.js              # Actually import
 */

const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURATION
// ============================================

const SUPABASE_URL = 'https://toyylgwekkcvorwiceas.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRveXlsZ3dla2tjdm9yd2ljZWFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI5MTcyNSwiZXhwIjoyMDgwODY3NzI1fQ.Ma2xDvpdFcaA7Lz-s2VuWlOwg-JmjQRPN-m1pqYu24A';
const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || '';

const CSV_FOLDER = path.join(__dirname, '..', 'exp csv');
const TELL_ME_ABOUT_YOURSELF_FILE = 'EPGP 2025-26 Interview Experience.xlsx - Tell me about yourself.csv';

// Rate limiting for API calls
const DELAY_BETWEEN_AI_CALLS = 1000; // 1 second
const DELAY_BETWEEN_DB_OPERATIONS = 100; // 100ms

// ============================================
// Initialize Clients
// ============================================

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

let genAI = null;
function getGenAI() {
    if (!genAI && GEMINI_API_KEY) {
        genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    }
    return genAI;
}

function getGeminiModel() {
    const ai = getGenAI();
    if (!ai) return null;
    return ai.getGenerativeModel({ model: 'gemini-2.0-flash' });
}

// ============================================
// Utility Functions
// ============================================

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeString(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// Fuzzy name matching - returns similarity score 0-1
function calculateNameSimilarity(name1, name2) {
    const n1 = normalizeString(name1);
    const n2 = normalizeString(name2);

    if (n1 === n2) return 1;

    const words1 = n1.split(' ').filter(w => w.length > 1);
    const words2 = n2.split(' ').filter(w => w.length > 1);

    if (words1.length === 0 || words2.length === 0) return 0;

    // Check for common words
    let commonWords = 0;
    for (const w1 of words1) {
        for (const w2 of words2) {
            if (w1 === w2 || w1.includes(w2) || w2.includes(w1)) {
                commonWords++;
                break;
            }
        }
    }

    const maxWords = Math.max(words1.length, words2.length);
    return commonWords / maxWords;
}

// Parse CSV with handling for multi-line content and quotes
function parseCSV(content) {
    const lines = content.split('\n');
    if (lines.length < 2) return { headers: [], rows: [] };

    // Parse header
    const headerLine = lines[0].replace(/\r$/, '');
    const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().trim());

    // Parse rows - handle multi-line content
    const rows = [];
    let currentRow = '';
    let inQuotes = false;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].replace(/\r$/, '');

        // Count quotes to determine if we're inside a quoted field
        for (const char of line) {
            if (char === '"') inQuotes = !inQuotes;
        }

        currentRow += (currentRow ? '\n' : '') + line;

        if (!inQuotes) {
            // Complete row - parse it
            const values = parseCSVLine(currentRow);
            if (values.some(v => v.trim())) {
                const row = {};
                headers.forEach((header, idx) => {
                    row[header] = values[idx] || '';
                });
                rows.push(row);
            }
            currentRow = '';
            inQuotes = false;
        }
    }

    return { headers, rows };
}

function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current.trim());

    return values;
}

// Extract company name from filename
function extractCompanyFromFilename(filename) {
    // Pattern: "EPGP 2025-26 Interview Experience.xlsx - [Company Name].csv"
    const match = filename.match(/\.xlsx\s*-\s*(.+)\.csv$/i);
    if (match) {
        return match[1].trim();
    }
    return filename.replace('.csv', '');
}

// Determine domain based on company and role
function guessDomain(company, role) {
    const text = `${company} ${role}`.toLowerCase();

    if (text.includes('consulting') || text.includes('strategy') || text.includes('advisory')) {
        return 'Consulting';
    }
    if (text.includes('tech') || text.includes('engineering') || text.includes('software') || text.includes('it') || text.includes('data')) {
        return 'IT';
    }
    if (text.includes('operations') || text.includes('supply chain') || text.includes('logistics')) {
        return 'Operations';
    }
    if (text.includes('finance') || text.includes('banking') || text.includes('investment')) {
        return 'Finance';
    }
    if (text.includes('marketing') || text.includes('sales') || text.includes('brand')) {
        return 'Marketing';
    }
    if (text.includes('hr') || text.includes('human resource')) {
        return 'HR';
    }
    if (text.includes('product') || text.includes('program') || text.includes('project')) {
        return 'General Management';
    }

    return 'Consulting'; // Default for most MBA roles
}

// ============================================
// AI Functions
// ============================================

async function refineContentWithAI(rawContent, company, role, tellMeAboutYourself) {
    const model = getGeminiModel();

    if (!model) {
        console.log('⚠️  No AI model available, using raw content');
        return formatWithoutAI(rawContent, company, role, tellMeAboutYourself);
    }

    const prompt = `You are an expert content editor for an MBA cohort platform. Structure this interview experience submission.

COMPANY: ${company}
ROLE: ${role || 'Not specified'}

RAW INTERVIEW EXPERIENCE:
${rawContent}

${tellMeAboutYourself ? `
CANDIDATE'S "TELL ME ABOUT YOURSELF" RESPONSE:
${tellMeAboutYourself}
` : ''}

FORMAT THE CONTENT WITH THESE SECTIONS (use ## for headings):

1. ## Interview Overview
Brief 2-3 sentence summary of the interview process, company, and role.

2. ## Interview Rounds
Detail each round with questions and answers/tips. Use bullet points.

3. ## Key Questions Asked
List the most notable questions asked (grouped by category if many).

${tellMeAboutYourself ? `4. ## 🎯 Tell Me About Yourself
Include the candidate's prepared "Tell me about yourself" response here.

5. ## Preparation Tips
Any tips the author mentioned for others.

6. ## Key Takeaways
Important learnings from the experience.

7. ## 📌 AI Summary & Prep Guidelines
` : `4. ## Preparation Tips
Any tips the author mentioned for others.

5. ## Key Takeaways
Important learnings from the experience.

6. ## 📌 AI Summary & Prep Guidelines
`}
Write a concise 2-3 sentence summary, followed by 3-5 short actionable tips (under 15 words each).

RULES:
- DO NOT change meaning or add false information
- Keep original voice and authenticity
- Only improve structure and readability
- Use markdown formatting

Output ONLY the formatted content in markdown:`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('AI refinement error:', error.message);
        return formatWithoutAI(rawContent, company, role, tellMeAboutYourself);
    }
}

function formatWithoutAI(rawContent, company, role, tellMeAboutYourself) {
    let formatted = `## Interview Overview\n\nInterview experience at ${company}${role ? ` for ${role}` : ''}.\n\n`;
    formatted += `## Interview Details\n\n${rawContent}\n\n`;

    if (tellMeAboutYourself) {
        formatted += `## 🎯 Tell Me About Yourself\n\n${tellMeAboutYourself}\n\n`;
    }

    return formatted;
}

// ============================================
// Data Processing
// ============================================

// Load "Tell Me About Yourself" data
function loadTellMeAboutYourself() {
    const filepath = path.join(CSV_FOLDER, TELL_ME_ABOUT_YOURSELF_FILE);

    if (!fs.existsSync(filepath)) {
        console.log('⚠️  Tell Me About Yourself file not found');
        return new Map();
    }

    const content = fs.readFileSync(filepath, 'utf-8');
    const { rows } = parseCSV(content);

    const tmayMap = new Map();

    for (const row of rows) {
        const name = row['candidate name'] || row['candidate'] || row['name'] || '';
        const response = row['response'] || row['answer'] || '';

        if (name && response && response.trim().length > 50) {
            tmayMap.set(normalizeString(name), response.trim());
        }
    }

    console.log(`📝 Loaded ${tmayMap.size} "Tell Me About Yourself" responses`);
    return tmayMap;
}

// Find the best matching "Tell Me About Yourself" response
function findTMAY(candidateName, tmayMap) {
    const normalizedName = normalizeString(candidateName);

    // Direct match
    if (tmayMap.has(normalizedName)) {
        return tmayMap.get(normalizedName);
    }

    // Fuzzy match
    let bestMatch = null;
    let bestScore = 0;

    for (const [name, response] of tmayMap) {
        const score = calculateNameSimilarity(candidateName, name);
        if (score > bestScore && score >= 0.5) {
            bestScore = score;
            bestMatch = response;
        }
    }

    return bestMatch;
}

// Parse all interview CSV files
function parseAllCSVFiles(tmayMap) {
    const files = fs.readdirSync(CSV_FOLDER).filter(f =>
        f.endsWith('.csv') && !f.includes('Tell me about yourself')
    );

    console.log(`\n📂 Found ${files.length} interview experience CSV files\n`);

    const allExperiences = [];

    for (const file of files) {
        const company = extractCompanyFromFilename(file);
        console.log(`  Processing: ${file}`);
        console.log(`  → Company: ${company}`);

        const filepath = path.join(CSV_FOLDER, file);
        const content = fs.readFileSync(filepath, 'utf-8');
        const { headers, rows } = parseCSV(content);

        console.log(`  → Headers: ${headers.join(', ')}`);
        console.log(`  → Rows: ${rows.length}`);

        for (const row of rows) {
            // Extract candidate name (try different column names)
            const candidateName = row['candidate name'] || row['candidate'] || row['name'] || '';

            if (!candidateName || candidateName.trim().length < 2) {
                continue; // Skip rows without candidate name
            }

            // Extract questions and answers
            const questions = row['questions asked'] || row['questions'] || row['questions '] || '';
            const answers = row['answers given'] || row['answers'] || row['answer'] || '';

            // Skip if no meaningful content
            if (questions.trim().length < 20 && answers.trim().length < 20) {
                continue;
            }

            // Combine questions and answers into raw content
            let rawContent = '';
            if (questions.trim()) {
                rawContent += `**Questions Asked:**\n${questions.trim()}\n\n`;
            }
            if (answers.trim()) {
                rawContent += `**Answers/Approach:**\n${answers.trim()}`;
            }

            // Find matching TMAY
            const tmay = findTMAY(candidateName.trim(), tmayMap);

            allExperiences.push({
                candidateName: candidateName.trim(),
                company: company,
                role: row['role'] || '',
                rawContent: rawContent.trim(),
                tellMeAboutYourself: tmay || null,
                sourceFile: file
            });
        }

        console.log('');
    }

    console.log(`\n📊 Total experiences parsed: ${allExperiences.length}\n`);
    return allExperiences;
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

async function checkExistingExperience(userId, company) {
    const { data, error } = await supabase
        .from('interview_experiences')
        .select('id')
        .eq('user_id', userId)
        .ilike('company', `%${company.split(' ')[0]}%`) // Match on first word
        .limit(1);

    if (error) return false;
    return data && data.length > 0;
}

async function insertExperience(userId, company, role, domain, content) {
    const { data, error } = await supabase
        .from('interview_experiences')
        .insert({
            user_id: userId,
            company: company,
            role: role || 'General',
            domain: domain,
            content: content,
            upvotes: 0,
            downvotes: 0
        })
        .select('id');

    if (error) {
        throw error;
    }

    return data[0];
}

// ============================================
// Main Import Function
// ============================================

async function runBulkImport(dryRun = false) {
    console.log('\n' + '='.repeat(60));
    console.log('📥 BULK IMPORT INTERVIEW EXPERIENCES');
    console.log('='.repeat(60));
    console.log(`Mode: ${dryRun ? '🔍 DRY RUN (no changes will be made)' : '💾 LIVE IMPORT'}`);
    console.log('='.repeat(60) + '\n');

    // Check Gemini API
    if (!GEMINI_API_KEY) {
        console.log('⚠️  GOOGLE_GEMINI_API_KEY not set. AI refinement will be skipped.');
        console.log('   Set it via: export GOOGLE_GEMINI_API_KEY="your-key"\n');
    }

    // Load data
    const tmayMap = loadTellMeAboutYourself();
    const users = await loadAllUsers();
    const experiences = parseAllCSVFiles(tmayMap);

    // Statistics
    const stats = {
        total: experiences.length,
        matched: 0,
        unmatched: 0,
        duplicates: 0,
        imported: 0,
        errors: 0
    };

    const unmatchedCandidates = [];

    console.log('\n' + '-'.repeat(60));
    console.log('PROCESSING EXPERIENCES');
    console.log('-'.repeat(60) + '\n');

    for (let i = 0; i < experiences.length; i++) {
        const exp = experiences[i];
        console.log(`\n[${i + 1}/${experiences.length}] ${exp.candidateName} - ${exp.company}`);

        // Find matching user
        const match = findMatchingUser(exp.candidateName, users);

        if (!match) {
            console.log(`  ❌ No matching user found`);
            stats.unmatched++;
            unmatchedCandidates.push(exp.candidateName);
            continue;
        }

        console.log(`  ✓ Matched to: ${match.user.name} (${(match.score * 100).toFixed(0)}% match)`);
        stats.matched++;

        // Check for duplicates
        if (!dryRun) {
            const exists = await checkExistingExperience(match.user.id, exp.company);
            if (exists) {
                console.log(`  ⚠️  Already has experience for ${exp.company}, skipping`);
                stats.duplicates++;
                continue;
            }
        }

        // AI Refinement
        let refinedContent = exp.rawContent;
        if (GEMINI_API_KEY) {
            console.log(`  🤖 Refining with AI...`);
            refinedContent = await refineContentWithAI(
                exp.rawContent,
                exp.company,
                exp.role,
                exp.tellMeAboutYourself
            );
            await sleep(DELAY_BETWEEN_AI_CALLS); // Rate limiting
        }

        const domain = guessDomain(exp.company, exp.role);

        if (dryRun) {
            console.log(`  📝 Would insert experience (${refinedContent.length} chars)`);
            console.log(`     Company: ${exp.company}`);
            console.log(`     Domain: ${domain}`);
            console.log(`     Has TMAY: ${exp.tellMeAboutYourself ? 'Yes' : 'No'}`);
        } else {
            try {
                await insertExperience(
                    match.user.id,
                    exp.company,
                    exp.role || 'General',
                    domain,
                    refinedContent
                );
                console.log(`  ✅ Imported successfully`);
                stats.imported++;
                await sleep(DELAY_BETWEEN_DB_OPERATIONS);
            } catch (error) {
                console.log(`  ❌ Error: ${error.message}`);
                stats.errors++;
            }
        }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total experiences parsed:  ${stats.total}`);
    console.log(`Users matched:             ${stats.matched}`);
    console.log(`Users not found:           ${stats.unmatched}`);
    console.log(`Duplicates skipped:        ${stats.duplicates}`);
    console.log(`Successfully imported:     ${stats.imported}`);
    console.log(`Errors:                    ${stats.errors}`);
    console.log('='.repeat(60) + '\n');

    if (unmatchedCandidates.length > 0) {
        console.log('⚠️  Unmatched candidates (check spelling/name format):');
        [...new Set(unmatchedCandidates)].forEach(name => {
            console.log(`   - ${name}`);
        });
        console.log('');
    }

    if (dryRun) {
        console.log('💡 This was a dry run. To actually import, run without --dry-run flag.');
    }
}

// ============================================
// CLI Entry Point
// ============================================

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('-d');

runBulkImport(dryRun).catch(console.error);
