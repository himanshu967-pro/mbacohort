'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { DOMAINS } from '@/types';

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

const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6 6 18"></path>
        <path d="m6 6 12 12"></path>
    </svg>
);

export default function UploadCVPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        domain: '',
        targetCompany: '',
    });

    const handleFileSelect = (file: File) => {
        if (file.type !== 'application/pdf') {
            setError('Please upload a PDF file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            setError('File size must be less than 5MB');
            return;
        }

        setSelectedFile(file);
        setError(null);
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!selectedFile) {
            setError('Please select a file to upload');
            return;
        }

        if (!formData.domain) {
            setError('Please select a domain');
            return;
        }

        setLoading(true);

        try {
            const supabase = createClient();

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError('You must be logged in to upload');
                return;
            }

            // Generate unique filename
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${user.id}_${Date.now()}.${fileExt}`;

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('resumes')
                .upload(fileName, selectedFile, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('resumes')
                .getPublicUrl(uploadData.path);

            // Get user name
            const { data: userProfile } = await supabase
                .from('users')
                .select('name')
                .eq('id', user.id)
                .single();

            // Save to database
            const { error: insertError } = await supabase
                .from('resumes')
                .insert({
                    user_id: user.id,
                    name: userProfile?.name || user.email?.split('@')[0] || 'Unknown',
                    file_url: publicUrl,
                    domain: formData.domain,
                    target_company: formData.targetCompany || null,
                });

            if (insertError) throw insertError;

            router.push('/cv-repository');
            router.refresh();
        } catch (err) {
            console.error('Error uploading:', err);
            setError('Failed to upload CV. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            {/* Back Link */}
            <Link
                href="/cv-repository"
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
                Back to Repository
            </Link>

            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-title">Upload Your CV</h1>
                <p className="page-subtitle">Share your resume with the cohort</p>
            </div>

            {/* Form Card */}
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

                    <form onSubmit={handleSubmit}>
                        {/* File Upload Area */}
                        <div className="input-group">
                            <label className="label">Resume File (PDF) *</label>

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
                                        accept=".pdf"
                                        onChange={handleInputChange}
                                        style={{ display: 'none' }}
                                    />
                                    <UploadIcon />
                                    <p style={{
                                        marginTop: 'var(--space-md)',
                                        fontWeight: 500,
                                        color: 'var(--text-primary)'
                                    }}>
                                        Drop your PDF here or click to browse
                                    </p>
                                    <p style={{
                                        fontSize: '0.875rem',
                                        color: 'var(--text-muted)',
                                        marginTop: 'var(--space-xs)'
                                    }}>
                                        Maximum file size: 5MB
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
                                    border: '1px solid var(--border-light)'
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
                                        onClick={() => setSelectedFile(null)}
                                        style={{ padding: '0.5rem' }}
                                    >
                                        <XIcon />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Domain */}
                        <div className="input-group">
                            <label className="label" htmlFor="domain">Domain *</label>
                            <select
                                id="domain"
                                name="domain"
                                className="input select"
                                value={formData.domain}
                                onChange={handleChange}
                                disabled={loading}
                            >
                                <option value="">Select your target domain</option>
                                {DOMAINS.map((domain) => (
                                    <option key={domain} value={domain}>{domain}</option>
                                ))}
                            </select>
                        </div>

                        {/* Target Company */}
                        <div className="input-group">
                            <label className="label" htmlFor="targetCompany">Target Company (Optional)</label>
                            <input
                                type="text"
                                id="targetCompany"
                                name="targetCompany"
                                className="input"
                                placeholder="e.g., McKinsey, Google, Goldman Sachs"
                                value={formData.targetCompany}
                                onChange={handleChange}
                                disabled={loading}
                            />
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                Which company was this CV tailored for?
                            </p>
                        </div>

                        {/* Submit Buttons */}
                        <div style={{
                            display: 'flex',
                            gap: 'var(--space-md)',
                            justifyContent: 'flex-end',
                            marginTop: 'var(--space-xl)'
                        }}>
                            <Link href="/cv-repository" className="btn btn-secondary">
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading || !selectedFile}
                            >
                                {loading ? (
                                    <>
                                        <LoaderIcon />
                                        Uploading...
                                    </>
                                ) : (
                                    'Upload CV'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Info Card */}
            <div className="card" style={{ marginTop: 'var(--space-xl)' }}>
                <div className="card-body">
                    <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}>🔒 Privacy Notice</h3>
                    <p style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6
                    }}>
                        Your CV will be visible to all members of the MBA cohort. Please ensure
                        you&apos;re comfortable sharing your resume before uploading. You can delete
                        your CV at any time from the repository.
                    </p>
                </div>
            </div>
        </div>
    );
}
