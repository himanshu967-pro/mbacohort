import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with service role for admin operations
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CSVRow {
    name: string;
    company?: string;
    domain?: string;
    specialization?: string;
    bio?: string;
    linkedin_url?: string;
    phone?: string;
}

function parseCSV(csvText: string): CSVRow[] {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    // Parse header (first line)
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));

    const rows: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        // Simple CSV parsing (handles basic cases)
        const values: string[] = [];
        let current = '';
        let inQuotes = false;

        for (const char of line) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim().replace(/^["']|["']$/g, ''));
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim().replace(/^["']|["']$/g, ''));

        // Map values to headers
        const row: Record<string, string> = {};
        headers.forEach((header, idx) => {
            if (values[idx]) {
                row[header] = values[idx];
            }
        });

        // Only include rows with a name
        if (row.name) {
            rows.push(row as unknown as CSVRow);
        }
    }

    return rows;
}

export async function POST(request: NextRequest) {
    try {
        const { csvData } = await request.json();

        if (!csvData || typeof csvData !== 'string') {
            return NextResponse.json(
                { error: 'CSV data is required' },
                { status: 400 }
            );
        }

        // Parse CSV
        const rows = parseCSV(csvData);

        if (rows.length === 0) {
            return NextResponse.json(
                { error: 'No valid rows found in CSV. Make sure first row is headers with "name" column.' },
                { status: 400 }
            );
        }

        // Get all existing users
        const { data: existingUsers, error: fetchError } = await supabase
            .from('users')
            .select('id, name, email');

        if (fetchError) {
            throw fetchError;
        }

        // Match and update
        const results = {
            updated: [] as string[],
            notFound: [] as string[],
            errors: [] as string[],
        };

        for (const row of rows) {
            // Find matching user by name (case-insensitive)
            const matchingUser = existingUsers?.find(
                user => user.name?.toLowerCase().trim() === row.name.toLowerCase().trim()
            );

            if (!matchingUser) {
                results.notFound.push(row.name);
                continue;
            }

            // Build update object (only include non-empty values)
            const updateData: Record<string, string> = {};
            if (row.company) updateData.company = row.company;
            if (row.domain) updateData.domain = row.domain;
            if (row.specialization) updateData.specialization = row.specialization;
            if (row.bio) updateData.bio = row.bio;
            if (row.linkedin_url) updateData.linkedin_url = row.linkedin_url;
            if (row.phone) updateData.phone = row.phone;

            if (Object.keys(updateData).length === 0) {
                results.errors.push(`${row.name}: No fields to update`);
                continue;
            }

            // Update user
            const { error: updateError } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', matchingUser.id);

            if (updateError) {
                results.errors.push(`${row.name}: ${updateError.message}`);
            } else {
                results.updated.push(row.name);
            }
        }

        return NextResponse.json({
            success: true,
            totalRows: rows.length,
            ...results
        });

    } catch (error) {
        console.error('Bulk import error:', error);
        return NextResponse.json(
            { error: 'Failed to process bulk import' },
            { status: 500 }
        );
    }
}
