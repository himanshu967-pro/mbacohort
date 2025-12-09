/**
 * Bulk User Creation Script for MBA Cohort
 * 
 * Usage:
 * 1. Create a CSV file named 'users.csv' in this directory
 * 2. Run: node scripts/create-users.js
 * 
 * CSV Format:
 * email,password,name,domain,company,linkedin
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ⚠️ IMPORTANT: Replace with your SERVICE ROLE key (not anon key!)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://toyylgwekkcvorwiceas.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE';

// Create admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Parse CSV
function parseCSV(content) {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
        // Handle quoted values with commas
        const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        const row = {};
        headers.forEach((header, idx) => {
            let val = values[idx] || '';
            // Remove surrounding quotes
            val = val.replace(/^"|"$/g, '').trim();
            row[header] = val;
        });
        rows.push(row);
    }

    return rows;
}

async function createUsers() {
    console.log('🚀 Starting bulk user creation...\n');

    // Read CSV file
    const csvPath = path.join(__dirname, 'users.csv');

    if (!fs.existsSync(csvPath)) {
        console.error('❌ Error: users.csv not found!');
        console.log('Create a file at:', csvPath);
        console.log('\nCSV Format:');
        console.log('email,password,name,domain,company,linkedin');
        console.log('user1@example.com,TempPass123!,John Doe,Consulting,McKinsey,https://linkedin.com/in/john');
        process.exit(1);
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const users = parseCSV(csvContent);

    console.log(`Found ${users.length} users to create\n`);

    let success = 0;
    let failed = 0;
    const errors = [];

    for (const user of users) {
        const email = user.email;
        const password = user.password || 'MBACohort2024!'; // Default password if not specified
        const name = user.name || email.split('@')[0];

        process.stdout.write(`Creating ${email}... `);

        try {
            // Create auth user
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: email,
                password: password,
                email_confirm: true, // Auto-confirm email
                user_metadata: {
                    name: name
                }
            });

            if (authError) {
                console.log('❌ Auth error:', authError.message);
                errors.push(`${email}: ${authError.message}`);
                failed++;
                continue;
            }

            // Create profile in users table
            const { error: profileError } = await supabase
                .from('users')
                .upsert({
                    id: authData.user.id,
                    email: email,
                    name: name,
                    domain: user.domain || null,
                    company: user.company || null,
                    linkedin_url: user.linkedin || null,
                    is_admin: false
                }, {
                    onConflict: 'id'
                });

            if (profileError) {
                console.log('⚠️ Profile error:', profileError.message);
                // User was created but profile failed - not critical
            }

            console.log('✅ Created');
            success++;

        } catch (err) {
            console.log('❌ Error:', err.message);
            errors.push(`${email}: ${err.message}`);
            failed++;
        }
    }

    console.log('\n========================================');
    console.log(`✅ Successfully created: ${success} users`);
    console.log(`❌ Failed: ${failed} users`);

    if (errors.length > 0) {
        console.log('\nErrors:');
        errors.forEach(e => console.log(`  - ${e}`));
    }

    console.log('\n📧 Users can now login with their email and password!');
    console.log('They can change their password in Settings after logging in.');
}

// Run
createUsers().catch(console.error);
