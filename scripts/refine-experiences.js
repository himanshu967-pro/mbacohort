/**
 * Refine Existing Interview Experiences with AI (Groq)
 * 
 * This script applies AI refinement to already-imported interview experiences.
 * Uses Groq API (free tier with generous limits).
 * 
 * Usage:
 *   GROQ_API_KEY="your-key" node scripts/refine-experiences.js
 */

const { createClient } = require('@supabase/supabase-js');
const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURATION
// ============================================

const SUPABASE_URL = 'https://toyylgwekkcvorwiceas.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRveXlsZ3dla2tjdm9yd2ljZWFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI5MTcyNSwiZXhwIjoyMDgwODY3NzI1fQ.Ma2xDvpdFcaA7Lz-s2VuWlOwg-JmjQRPN-m1pqYu24A';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

const CSV_FOLDER = path.join(__dirname, '..', 'exp csv');
const TELL_ME_ABOUT_YOURSELF_FILE = 'EPGP 2025-26 Interview Experience.xlsx - Tell me about yourself.csv';

const DELAY_BETWEEN_AI_CALLS = 2000; // 2 seconds - Groq has generous limits

// ============================================
// Initialize Clients
// ============================================

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

let groq = null;
function getGroq() {
    if (!groq && GROQ_API_KEY) {
        groq = new Groq({ apiKey: GROQ_API_KEY });
    }
    return groq;
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

// Parse CSV
function parseCSV(content) {
    const lines = content.split('\n');
    if (lines.length < 2) return { headers: [], rows: [] };

    const headerLine = lines[0].replace(/\r$/, '');
    const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().trim());

    const rows = [];
    let currentRow = '';
    let inQuotes = false;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].replace(/\r$/, '');

        for (const char of line) {
            if (char === '"') inQuotes = !inQuotes;
        }

        currentRow += (currentRow ? '\n' : '') + line;

        if (!inQuotes) {
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

function findTMAY(candidateName, tmayMap) {
    const normalizedName = normalizeString(candidateName);

    if (tmayMap.has(normalizedName)) {
        return tmayMap.get(normalizedName);
    }

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

// ============================================
// AI Refinement with Groq
// ============================================

const SYSTEM_PROMPT = `You are an expert content editor for an MBA cohort platform. Your task is to structure and refine interview experience submissions from students.

IMPORTANT RULES:
1. DO NOT change the meaning or add false information
2. Keep the original voice and authenticity  
3. Only improve structure, formatting, and readability
4. Use markdown formatting with ## headings
5. Output ONLY the formatted content, no additional commentary`;

async function refineContentWithAI(rawContent, company, role, tellMeAboutYourself) {
    const client = getGroq();

    if (!client) {
        console.log('⚠️  No Groq client available');
        return null;
    }

    const userPrompt = `Structure this interview experience submission:

COMPANY: ${company}
ROLE: ${role || 'Not specified'}

RAW INTERVIEW EXPERIENCE:
${rawContent}

${tellMeAboutYourself ? `
CANDIDATE'S "TELL ME ABOUT YOURSELF" RESPONSE:
${tellMeAboutYourself}
` : ''}

FORMAT WITH THESE SECTIONS:

## Interview Overview
Brief 2-3 sentence summary of the interview process, company, and role.

## Interview Rounds
Detail each round with questions and answers/tips. Use bullet points for clarity.

## Key Questions Asked
List the most notable questions (group by category if many).

${tellMeAboutYourself ? `## 🎯 Tell Me About Yourself
Include the candidate's prepared "Tell me about yourself" response.

` : ''}## Preparation Tips
Any tips the author mentioned for future candidates.

## Key Takeaways
Important learnings from this interview experience.

## 📌 AI Summary & Prep Guidelines
Write a 2-3 sentence summary of the experience, then provide 3-5 short actionable tips (under 15 words each) as a numbered list.`;

    try {
        const completion = await client.chat.completions.create({
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userPrompt }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3,
            max_tokens: 4000
        });

        return completion.choices[0]?.message?.content || null;
    } catch (error) {
        console.error('AI refinement error:', error.message);
        return null;
    }
}

// ============================================
// Main Function
// ============================================

async function refineExperiences() {
    console.log('\n' + '='.repeat(60));
    console.log('🤖 REFINE INTERVIEW EXPERIENCES WITH AI (Groq)');
    console.log('='.repeat(60) + '\n');

    if (!GROQ_API_KEY) {
        console.error('❌ ERROR: GROQ_API_KEY is required');
        console.log('Get your free API key from: https://console.groq.com/keys');
        console.log('Set it via: GROQ_API_KEY="your-key" node scripts/refine-experiences.js');
        process.exit(1);
    }

    // Load TMAY data
    const tmayMap = loadTellMeAboutYourself();

    // Fetch all experiences
    const { data: experiences, error } = await supabase
        .from('interview_experiences')
        .select(`
            id,
            company,
            role,
            domain,
            content,
            user:users(id, name)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching experiences:', error);
        return;
    }

    console.log(`📊 Found ${experiences.length} interview experiences\n`);

    // Filter experiences that need refinement
    const needsRefinement = experiences.filter(exp =>
        !exp.content.includes('## Interview Overview') &&
        !exp.content.includes('## 📌 AI Summary')
    );

    console.log(`🔄 ${needsRefinement.length} experiences need AI refinement\n`);

    if (needsRefinement.length === 0) {
        console.log('✅ All experiences are already refined!');
        return;
    }

    let refined = 0;
    let errors = 0;

    for (let i = 0; i < needsRefinement.length; i++) {
        const exp = needsRefinement[i];
        const userName = exp.user?.name || 'Unknown';

        console.log(`\n[${i + 1}/${needsRefinement.length}] ${userName} - ${exp.company}`);

        // Find TMAY for this user
        const tmay = findTMAY(userName, tmayMap);
        if (tmay) {
            console.log(`  📝 Found "Tell Me About Yourself" response`);
        }

        // Refine with AI
        console.log(`  🤖 Refining with Groq AI...`);
        const refinedContent = await refineContentWithAI(
            exp.content,
            exp.company,
            exp.role,
            tmay
        );

        if (refinedContent) {
            // Update in database
            const { error: updateError } = await supabase
                .from('interview_experiences')
                .update({ content: refinedContent })
                .eq('id', exp.id);

            if (updateError) {
                console.log(`  ❌ Update error: ${updateError.message}`);
                errors++;
            } else {
                console.log(`  ✅ Refined successfully (${refinedContent.length} chars)`);
                refined++;
            }
        } else {
            console.log(`  ⚠️  AI refinement failed, skipping`);
            errors++;
        }

        // Rate limiting
        await sleep(DELAY_BETWEEN_AI_CALLS);
    }

    console.log('\n' + '='.repeat(60));
    console.log('REFINEMENT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Successfully refined:  ${refined}`);
    console.log(`Errors:               ${errors}`);
    console.log('='.repeat(60) + '\n');
}

// Run
refineExperiences().catch(console.error);
