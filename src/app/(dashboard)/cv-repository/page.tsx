'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Resume, DOMAINS } from '@/types';

// Icons
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.3-4.3"></path>
    </svg>
);

const FilterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
    </svg>
);

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" x2="12" y1="3" y2="15"></line>
    </svg>
);

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" x2="12" y1="15" y2="3"></line>
    </svg>
);

const FileTextIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" x2="8" y1="13" y2="13"></line>
        <line x1="16" x2="8" y1="17" y2="17"></line>
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18"></path>
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
    </svg>
);

interface ResumeCardProps {
    resume: Resume;
    currentUserId?: string;
    onDelete: (id: string) => void;
    onDownload: (resume: Resume) => void;
}

function ResumeCard({ resume, currentUserId, onDelete, onDownload }: ResumeCardProps) {
    const isOwner = currentUserId === resume.user_id;
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="card" style={{ height: '100%' }}>
            <div className="card-body" style={{
                display: 'flex',
                flexDirection: 'column',
                padding: 'var(--space-lg)'
            }}>
                {/* Header with user info */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 'var(--space-md)'
                }}>
                    <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
                        {resume.user?.profile_picture ? (
                            <img
                                src={resume.user.profile_picture}
                                alt={resume.user.name}
                                className="avatar"
                            />
                        ) : (
                            <div className="avatar avatar-placeholder">
                                {getInitials(resume.user?.name || resume.name)}
                            </div>
                        )}
                        <div>
                            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                {resume.user?.name || resume.name}
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                {formatDate(resume.created_at)}
                            </div>
                        </div>
                    </div>

                    {isOwner && (
                        <button
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '0.375rem', color: 'var(--error)' }}
                            title="Delete"
                            onClick={() => setShowDeleteConfirm(true)}
                        >
                            <TrashIcon />
                        </button>
                    )}
                </div>

                {/* Domain & Target Company */}
                <div style={{
                    display: 'flex',
                    gap: 'var(--space-sm)',
                    marginBottom: 'var(--space-md)',
                    flexWrap: 'wrap'
                }}>
                    <span className="badge badge-primary">{resume.domain}</span>
                    {resume.target_company && (
                        <span className="badge badge-accent">{resume.target_company}</span>
                    )}
                </div>

                {/* PDF Preview placeholder */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--gray-50)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-xl)',
                    marginBottom: 'var(--space-md)',
                    minHeight: '120px'
                }}>
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        <FileTextIcon />
                        <p style={{ fontSize: '0.875rem', marginTop: 'var(--space-sm)' }}>PDF Resume</p>
                    </div>
                </div>

                {/* Download Button */}
                <button
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => onDownload(resume)}
                >
                    <DownloadIcon />
                    Download CV
                </button>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="modal-backdrop" onClick={() => setShowDeleteConfirm(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">Delete Resume?</h3>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    style={{ padding: '0.25rem' }}
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to delete this resume? This action cannot be undone.</p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowDeleteConfirm(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn"
                                    style={{ background: 'var(--error)', color: 'white' }}
                                    onClick={() => {
                                        onDelete(resume.id);
                                        setShowDeleteConfirm(false);
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function CVRepositoryPage() {
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string>();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDomain, setSelectedDomain] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchResumes();
        fetchCurrentUser();
    }, []);

    const fetchCurrentUser = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id);
    };

    const fetchResumes = async () => {
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('resumes')
                .select(`
          *,
          user:users(id, name, profile_picture)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setResumes(data || []);
        } catch (error) {
            console.error('Error fetching resumes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (resumeId: string) => {
        try {
            const supabase = createClient();

            // Get the resume to get file URL
            const resume = resumes.find(r => r.id === resumeId);
            if (resume?.file_url) {
                // Extract file path from URL and delete from storage
                const filePath = resume.file_url.split('/').pop();
                if (filePath) {
                    await supabase.storage.from('resumes').remove([filePath]);
                }
            }

            // Delete from database
            const { error } = await supabase
                .from('resumes')
                .delete()
                .eq('id', resumeId);

            if (error) throw error;

            setResumes(prev => prev.filter(r => r.id !== resumeId));
        } catch (error) {
            console.error('Error deleting:', error);
        }
    };

    const handleDownload = async (resume: Resume) => {
        try {
            const supabase = createClient();

            // Get signed URL for download
            const filePath = resume.file_url.split('/').pop();
            if (!filePath) return;

            const { data, error } = await supabase.storage
                .from('resumes')
                .createSignedUrl(filePath, 60); // 60 seconds expiry

            if (error) throw error;

            // Open download in new tab
            window.open(data.signedUrl, '_blank');
        } catch (error) {
            console.error('Error downloading:', error);
            // Fallback: try direct URL
            window.open(resume.file_url, '_blank');
        }
    };

    // Filter resumes
    const filteredResumes = resumes.filter((resume) => {
        const matchesSearch =
            (resume.user?.name || resume.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
            (resume.target_company?.toLowerCase() || '').includes(searchQuery.toLowerCase());

        const matchesDomain = !selectedDomain || resume.domain === selectedDomain;

        return matchesSearch && matchesDomain;
    });

    return (
        <div>
            {/* Page Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 'var(--space-xl)',
                flexWrap: 'wrap',
                gap: 'var(--space-md)'
            }}>
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h1 className="page-title">Golden CV Repository</h1>
                    <p className="page-subtitle">Access and share successful resumes from your cohort</p>
                </div>
                <Link href="/cv-repository/upload" className="btn btn-primary">
                    <UploadIcon />
                    Upload CV
                </Link>
            </div>

            {/* Search and Filters */}
            <div style={{
                display: 'flex',
                gap: 'var(--space-md)',
                marginBottom: 'var(--space-xl)',
                flexWrap: 'wrap'
            }}>
                {/* Search Bar */}
                <div className="search-bar" style={{ flex: 1, minWidth: '250px' }}>
                    <SearchIcon />
                    <input
                        type="text"
                        className="input"
                        placeholder="Search by name or target company..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ paddingLeft: '2.75rem' }}
                    />
                </div>

                {/* Filter Toggle */}
                <button
                    className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <FilterIcon />
                    Filters {selectedDomain && '(1)'}
                </button>
            </div>

            {/* Domain Filter Chips */}
            {showFilters && (
                <div style={{
                    display: 'flex',
                    gap: 'var(--space-sm)',
                    marginBottom: 'var(--space-xl)',
                    flexWrap: 'wrap'
                }}>
                    <button
                        className={`chip ${!selectedDomain ? 'chip-active' : ''}`}
                        onClick={() => setSelectedDomain('')}
                    >
                        All Domains
                    </button>
                    {DOMAINS.map((domain) => (
                        <button
                            key={domain}
                            className={`chip ${selectedDomain === domain ? 'chip-active' : ''}`}
                            onClick={() => setSelectedDomain(domain)}
                        >
                            {domain}
                        </button>
                    ))}
                </div>
            )}

            {/* Results Info */}
            <div style={{
                marginBottom: 'var(--space-lg)',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)'
            }}>
                Showing {filteredResumes.length} CV{filteredResumes.length !== 1 ? 's' : ''}
            </div>

            {/* Resumes Grid */}
            {loading ? (
                <div className="grid-members stagger">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="card">
                            <div className="card-body">
                                <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                                    <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                                    <div>
                                        <div className="skeleton" style={{ width: '100px', height: '16px', marginBottom: '0.5rem' }} />
                                        <div className="skeleton" style={{ width: '60px', height: '12px' }} />
                                    </div>
                                </div>
                                <div className="skeleton" style={{ width: '100%', height: '120px', marginBottom: 'var(--space-md)' }} />
                                <div className="skeleton" style={{ width: '100%', height: '40px', borderRadius: 'var(--radius-lg)' }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredResumes.length > 0 ? (
                <div className="grid-members stagger">
                    {filteredResumes.map((resume) => (
                        <ResumeCard
                            key={resume.id}
                            resume={resume}
                            currentUserId={currentUserId}
                            onDelete={handleDelete}
                            onDownload={handleDownload}
                        />
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <FileTextIcon />
                    <h3 style={{ marginTop: 'var(--space-lg)' }}>No CVs uploaded yet</h3>
                    <p style={{ marginBottom: 'var(--space-lg)' }}>
                        Be the first to share your resume!
                    </p>
                    <Link href="/cv-repository/upload" className="btn btn-primary">
                        <UploadIcon />
                        Upload Your CV
                    </Link>
                </div>
            )}
        </div>
    );
}
