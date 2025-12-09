'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// Icons
const ArrowLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5"></path>
        <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
);

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" x2="12" y1="3" y2="15"></line>
    </svg>
);

const FileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
    </svg>
);

const LoaderIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
    </svg>
);

const CheckCircle = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);

const XCircle = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="m15 9-6 6"></path>
        <path d="m9 9 6 6"></path>
    </svg>
);

const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6 6 18"></path>
        <path d="m6 6 12 12"></path>
    </svg>
);

interface ImportResult {
    success: number;
    failed: number;
    errors: string[];
}

export default function AdminImportPage() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [importType, setImportType] = useState<'users'>('users');

    const handleFileSelect = (file: File) => {
        if (!file.name.endsWith('.csv')) {
            setError('Please upload a CSV file');
            return;
        }

        setSelectedFile(file);
        setError(null);
        setImportResult(null);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const parseCSV = (content: string): Record<string, string>[] => {
        const lines = content.trim().split('\n');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const rows: Record<string, string>[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const row: Record<string, string> = {};
            headers.forEach((header, idx) => {
                row[header] = values[idx] || '';
            });
            rows.push(row);
        }

        return rows;
    };

    const handleImport = async () => {
        if (!selectedFile) return;

        setLoading(true);
        setError(null);
        setImportResult(null);

        try {
            const content = await selectedFile.text();
            const rows = parseCSV(content);

            if (rows.length === 0) {
                setError('CSV file is empty or invalid');
                return;
            }

            const supabase = createClient();
            let success = 0;
            let failed = 0;
            const errors: string[] = [];

            if (importType === 'users') {
                // Validate required columns
                const requiredCols = ['email', 'name'];
                const headers = Object.keys(rows[0]);
                const missingCols = requiredCols.filter(col => !headers.includes(col));

                if (missingCols.length > 0) {
                    setError(`Missing required columns: ${missingCols.join(', ')}`);
                    return;
                }

                // Import each user
                for (const row of rows) {
                    try {
                        // Create auth user (this would need admin API or invite system)
                        // For now, just add to users table with a placeholder
                        const { error: insertError } = await supabase
                            .from('users')
                            .upsert({
                                email: row.email,
                                name: row.name,
                                domain: row.domain || null,
                                company: row.company || null,
                                linkedin_url: row.linkedin || null,
                                is_admin: row.is_admin === 'true',
                            }, {
                                onConflict: 'email'
                            });

                        if (insertError) {
                            errors.push(`${row.email}: ${insertError.message}`);
                            failed++;
                        } else {
                            success++;
                        }
                    } catch (err) {
                        errors.push(`${row.email}: Unknown error`);
                        failed++;
                    }
                }
            }

            setImportResult({ success, failed, errors });

        } catch (err) {
            console.error('Import error:', err);
            setError('Failed to process CSV file');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            {/* Back Link */}
            <Link
                href="/admin"
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--space-lg)',
                    fontSize: '0.875rem'
                }}
            >
                <ArrowLeftIcon />
                Back to Admin
            </Link>

            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-title">Bulk Data Import</h1>
                <p className="page-subtitle">Import users or data via CSV file</p>
            </div>

            {/* Import Type Selection */}
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="card-body">
                    <label className="label">Import Type</label>
                    <select
                        className="input select"
                        value={importType}
                        onChange={(e) => setImportType(e.target.value as 'users')}
                    >
                        <option value="users">Users</option>
                    </select>
                </div>
            </div>

            {/* CSV Format Guide */}
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="card-body">
                    <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}>
                        📋 CSV Format for Users
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                        Your CSV file should have the following columns:
                    </p>
                    <div style={{
                        background: 'var(--gray-50)',
                        padding: 'var(--space-md)',
                        borderRadius: 'var(--radius-md)',
                        fontFamily: 'monospace',
                        fontSize: '0.8125rem',
                        overflowX: 'auto'
                    }}>
                        <code>email,name,domain,company,linkedin,is_admin</code>
                    </div>
                    <p style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        marginTop: 'var(--space-sm)'
                    }}>
                        Required: email, name | Optional: domain, company, linkedin, is_admin
                    </p>
                </div>
            </div>

            {/* Upload Card */}
            <div className="card">
                <div className="card-body" style={{ padding: 'var(--space-xl)' }}>
                    {/* Error Message */}
                    {error && (
                        <div style={{
                            padding: 'var(--space-md)',
                            background: 'var(--error-light)',
                            color: '#991b1b',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--space-lg)',
                            fontSize: '0.875rem',
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Import Result */}
                    {importResult && (
                        <div style={{
                            padding: 'var(--space-lg)',
                            background: importResult.failed === 0 ? 'var(--success-light)' : 'var(--warning-light)',
                            borderRadius: 'var(--radius-lg)',
                            marginBottom: 'var(--space-lg)',
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-md)',
                                marginBottom: 'var(--space-md)'
                            }}>
                                {importResult.failed === 0 ? (
                                    <CheckCircle />
                                ) : (
                                    <XCircle />
                                )}
                                <h3 style={{ fontSize: '1rem', margin: 0 }}>Import Complete</h3>
                            </div>
                            <p style={{ fontSize: '0.875rem', marginBottom: 'var(--space-sm)' }}>
                                <strong>{importResult.success}</strong> records imported successfully
                            </p>
                            {importResult.failed > 0 && (
                                <>
                                    <p style={{ fontSize: '0.875rem', marginBottom: 'var(--space-sm)', color: '#92400e' }}>
                                        <strong>{importResult.failed}</strong> records failed
                                    </p>
                                    {importResult.errors.length > 0 && (
                                        <details style={{ fontSize: '0.8125rem' }}>
                                            <summary style={{ cursor: 'pointer' }}>View errors</summary>
                                            <ul style={{ marginTop: 'var(--space-sm)', paddingLeft: 'var(--space-lg)' }}>
                                                {importResult.errors.slice(0, 10).map((err, i) => (
                                                    <li key={i}>{err}</li>
                                                ))}
                                                {importResult.errors.length > 10 && (
                                                    <li>... and {importResult.errors.length - 10} more</li>
                                                )}
                                            </ul>
                                        </details>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* File Upload Area */}
                    {!selectedFile ? (
                        <div
                            className={`file-upload ${dragOver ? 'dragover' : ''}`}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleInputChange}
                                style={{ display: 'none' }}
                            />
                            <UploadIcon />
                            <p style={{
                                marginTop: 'var(--space-md)',
                                fontWeight: 500,
                                color: 'var(--text-primary)'
                            }}>
                                Drop your CSV file here or click to browse
                            </p>
                            <p style={{
                                fontSize: '0.875rem',
                                color: 'var(--text-muted)',
                                marginTop: 'var(--space-xs)'
                            }}>
                                Only .csv files are supported
                            </p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-md)',
                            padding: 'var(--space-md)',
                            background: 'var(--gray-50)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--border-light)',
                            marginBottom: 'var(--space-lg)'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--primary-100)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--primary-600)'
                            }}>
                                <FileIcon />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                    {selectedFile.name}
                                </div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                    {(selectedFile.size / 1024).toFixed(1)} KB
                                </div>
                            </div>
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => {
                                    setSelectedFile(null);
                                    setImportResult(null);
                                }}
                                style={{ padding: '0.5rem' }}
                            >
                                <XIcon />
                            </button>
                        </div>
                    )}

                    {/* Import Button */}
                    {selectedFile && (
                        <button
                            className="btn btn-primary"
                            onClick={handleImport}
                            disabled={loading}
                            style={{ width: '100%', justifyContent: 'center' }}
                        >
                            {loading ? (
                                <>
                                    <LoaderIcon />
                                    Importing...
                                </>
                            ) : (
                                'Start Import'
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Warning */}
            <div className="card" style={{
                marginTop: 'var(--space-xl)',
                background: 'var(--warning-light)',
                border: '1px solid var(--warning)'
            }}>
                <div className="card-body">
                    <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-sm)' }}>⚠️ Important Note</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        This import will add or update user records in the database. Users imported
                        this way will need to use the &quot;Forgot Password&quot; flow to set their password
                        before logging in.
                    </p>
                </div>
            </div>
        </div>
    );
}
