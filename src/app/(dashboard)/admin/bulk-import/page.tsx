'use client';

import { useState } from 'react';

// Icons
const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" x2="12" y1="3" y2="15"></line>
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

const AlertIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" x2="12" y1="8" y2="12"></line>
        <line x1="12" x2="12.01" y1="16" y2="16"></line>
    </svg>
);

const LoaderIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
    </svg>
);

interface ImportResult {
    success: boolean;
    totalRows: number;
    updated: string[];
    notFound: string[];
    errors: string[];
}

export default function BulkImportPage() {
    const [csvData, setCsvData] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            setCsvData(text);
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        if (!csvData.trim()) {
            setError('Please upload a CSV file or paste CSV data');
            return;
        }

        setIsUploading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch('/api/admin/bulk-import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ csvData }),
            });

            const data = await response.json();

            if (data.error) {
                setError(data.error);
            } else {
                setResult(data);
            }
        } catch {
            setError('Failed to process import. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const sampleCSV = `name,company,domain,specialization,bio
John Doe,McKinsey,Consulting,Strategy,Experienced consultant with 5 years in strategy
Jane Smith,Google,IT,Product Management,Product manager focused on AI products
Bob Wilson,Goldman Sachs,Finance,Investment Banking,IB analyst with M&A experience`;

    return (
        <div style={{ maxWidth: '900px' }}>
            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-title">Bulk Profile Import</h1>
                <p className="page-subtitle">
                    Update member profiles from a CSV file. Matches by name and updates profile fields.
                </p>
            </div>

            {/* Instructions */}
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="card-body">
                    <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}>📋 CSV Format</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)', fontSize: '0.875rem' }}>
                        Your CSV should have a header row with column names. The <strong>name</strong> column is required for matching.
                    </p>

                    <div style={{ marginBottom: 'var(--space-md)' }}>
                        <strong style={{ fontSize: '0.875rem' }}>Supported columns:</strong>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                            {['name (required)', 'company', 'domain', 'specialization', 'bio', 'linkedin_url', 'phone'].map(col => (
                                <span key={col} className="badge badge-primary">{col}</span>
                            ))}
                        </div>
                    </div>

                    <details style={{ marginTop: 'var(--space-md)' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' }}>
                            View sample CSV
                        </summary>
                        <pre style={{
                            background: 'var(--gray-100)',
                            padding: 'var(--space-md)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.75rem',
                            overflow: 'auto',
                            marginTop: 'var(--space-sm)'
                        }}>
                            {sampleCSV}
                        </pre>
                    </details>
                </div>
            </div>

            {/* Upload Area */}
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="card-body">
                    <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-lg)' }}>Upload CSV</h3>

                    {/* File Upload */}
                    <div className="file-upload" style={{ marginBottom: 'var(--space-lg)' }}>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            style={{ display: 'none' }}
                            id="csv-upload"
                        />
                        <label htmlFor="csv-upload" style={{ cursor: 'pointer', display: 'block' }}>
                            <UploadIcon />
                            <p style={{ marginTop: 'var(--space-sm)', fontWeight: 500 }}>
                                Click to upload CSV file
                            </p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                or paste CSV data below
                            </p>
                        </label>
                    </div>

                    {/* Manual Entry */}
                    <div className="input-group">
                        <label className="label">Or paste CSV data directly:</label>
                        <textarea
                            className="input textarea"
                            placeholder={sampleCSV}
                            value={csvData}
                            onChange={(e) => setCsvData(e.target.value)}
                            style={{ minHeight: '200px', fontFamily: 'monospace', fontSize: '0.8125rem' }}
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{
                            padding: 'var(--space-md)',
                            background: 'var(--error-light)',
                            color: '#991b1b',
                            borderRadius: 'var(--radius-md)',
                            marginTop: 'var(--space-md)',
                            fontSize: '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <AlertIcon />
                            {error}
                        </div>
                    )}

                    {/* Import Button */}
                    <div style={{ marginTop: 'var(--space-lg)' }}>
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleImport}
                            disabled={isUploading || !csvData.trim()}
                        >
                            {isUploading ? (
                                <>
                                    <LoaderIcon />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <UploadIcon />
                                    Import Profiles
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Results */}
            {result && (
                <div className="card">
                    <div className="card-body">
                        <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckIcon />
                            Import Complete
                        </h3>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: 'var(--space-md)',
                            marginBottom: 'var(--space-lg)'
                        }}>
                            <div style={{
                                background: 'var(--success-light)',
                                padding: 'var(--space-md)',
                                borderRadius: 'var(--radius-md)',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#065f46' }}>
                                    {result.updated.length}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#065f46' }}>Updated</div>
                            </div>
                            <div style={{
                                background: 'var(--warning-light)',
                                padding: 'var(--space-md)',
                                borderRadius: 'var(--radius-md)',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#92400e' }}>
                                    {result.notFound.length}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#92400e' }}>Not Found</div>
                            </div>
                            <div style={{
                                background: 'var(--error-light)',
                                padding: 'var(--space-md)',
                                borderRadius: 'var(--radius-md)',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#991b1b' }}>
                                    {result.errors.length}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#991b1b' }}>Errors</div>
                            </div>
                        </div>

                        {/* Updated List */}
                        {result.updated.length > 0 && (
                            <div style={{ marginBottom: 'var(--space-md)' }}>
                                <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>✅ Updated:</h4>
                                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                    {result.updated.join(', ')}
                                </div>
                            </div>
                        )}

                        {/* Not Found List */}
                        {result.notFound.length > 0 && (
                            <div style={{ marginBottom: 'var(--space-md)' }}>
                                <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>⚠️ Not found (names don&apos;t match any member):</h4>
                                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                    {result.notFound.join(', ')}
                                </div>
                            </div>
                        )}

                        {/* Errors List */}
                        {result.errors.length > 0 && (
                            <div>
                                <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>❌ Errors:</h4>
                                <ul style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', paddingLeft: '1.5rem' }}>
                                    {result.errors.map((err, i) => (
                                        <li key={i}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
