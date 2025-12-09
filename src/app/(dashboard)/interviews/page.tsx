'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { InterviewExperience, DOMAINS } from '@/types';
import { CompanyLogo } from '@/components/ui';

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

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14"></path>
        <path d="M5 12h14"></path>
    </svg>
);

const ThumbsUpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 10v12"></path>
        <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"></path>
    </svg>
);

const ThumbsDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 14V2"></path>
        <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"></path>
    </svg>
);

const BriefcaseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="7" rx="2" ry="2"></rect>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
    </svg>
);

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
        <path d="m15 5 4 4"></path>
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18"></path>
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
    </svg>
);

interface InterviewCardProps {
    experience: InterviewExperience;
    currentUserId?: string;
    onVote: (id: string, isUpvote: boolean) => void;
    onDelete: (id: string) => void;
}

function InterviewCard({ experience, currentUserId, onVote, onDelete }: InterviewCardProps) {
    const isOwner = currentUserId === experience.user_id;
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
        <div className="card">
            <div className="card-body">
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 'var(--space-md)'
                }}>
                    <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
                        {experience.user?.profile_picture ? (
                            <img
                                src={experience.user.profile_picture}
                                alt={experience.user.name}
                                className="avatar"
                            />
                        ) : (
                            <div className="avatar avatar-placeholder">
                                {getInitials(experience.user?.name || 'U')}
                            </div>
                        )}
                        <div>
                            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                {experience.user?.name || 'Anonymous'}
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                {formatDate(experience.created_at)}
                            </div>
                        </div>
                    </div>

                    {isOwner && (
                        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                            <Link
                                href={`/interviews/${experience.id}/edit`}
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '0.375rem' }}
                                title="Edit"
                            >
                                <EditIcon />
                            </Link>
                            <button
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '0.375rem', color: 'var(--error)' }}
                                title="Delete"
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                <TrashIcon />
                            </button>
                        </div>
                    )}
                </div>

                {/* Company & Role with Logo */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-md)',
                    marginBottom: 'var(--space-xs)'
                }}>
                    <CompanyLogo company={experience.company} size="lg" />
                    <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        margin: 0
                    }}>
                        {experience.company}
                    </h3>
                </div>
                <div style={{
                    display: 'flex',
                    gap: 'var(--space-sm)',
                    marginBottom: 'var(--space-md)',
                    flexWrap: 'wrap'
                }}>
                    <span className="badge badge-primary">{experience.role}</span>
                    <span className="badge badge-accent">{experience.domain}</span>
                </div>

                {/* Content Preview */}
                <p style={{
                    fontSize: '0.9375rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    marginBottom: 'var(--space-lg)',
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                }}>
                    {experience.content}
                </p>

                {/* Footer */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 'var(--space-md)',
                    borderTop: '1px solid var(--border-light)'
                }}>
                    {/* Vote Buttons */}
                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                        <button
                            className={`vote-btn upvote ${experience.user_vote === 'up' ? 'active' : ''}`}
                            onClick={() => onVote(experience.id, true)}
                        >
                            <ThumbsUpIcon />
                            <span>{experience.upvotes}</span>
                        </button>
                        <button
                            className={`vote-btn downvote ${experience.user_vote === 'down' ? 'active' : ''}`}
                            onClick={() => onVote(experience.id, false)}
                        >
                            <ThumbsDownIcon />
                            <span>{experience.downvotes}</span>
                        </button>
                    </div>

                    {/* Read More */}
                    <Link
                        href={`/interviews/${experience.id}`}
                        className="btn btn-secondary btn-sm"
                    >
                        Read Full Experience
                    </Link>
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="modal-backdrop" onClick={() => setShowDeleteConfirm(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">Delete Experience?</h3>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    style={{ padding: '0.25rem' }}
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to delete this interview experience? This action cannot be undone.</p>
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
                                        onDelete(experience.id);
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

export default function InterviewsPage() {
    const [experiences, setExperiences] = useState<InterviewExperience[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string>();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDomain, setSelectedDomain] = useState<string>('');
    const [companyFilter, setCompanyFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchExperiences();
        fetchCurrentUser();
    }, []);

    const fetchCurrentUser = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id);
    };

    const fetchExperiences = async () => {
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('interview_experiences')
                .select(`
          *,
          user:users(id, name, profile_picture)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setExperiences(data || []);
        } catch (error) {
            console.error('Error fetching experiences:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (experienceId: string, isUpvote: boolean) => {
        if (!currentUserId) return;

        try {
            const supabase = createClient();

            // Check if user already voted
            const experience = experiences.find(e => e.id === experienceId);
            if (!experience) return;

            const currentVote = experience.user_vote;

            let newUpvotes = experience.upvotes;
            let newDownvotes = experience.downvotes;
            let newUserVote: 'up' | 'down' | null = null;

            if (currentVote === (isUpvote ? 'up' : 'down')) {
                // Remove vote
                if (isUpvote) newUpvotes--;
                else newDownvotes--;
                newUserVote = null;
            } else if (currentVote === (isUpvote ? 'down' : 'up')) {
                // Change vote
                if (isUpvote) {
                    newUpvotes++;
                    newDownvotes--;
                } else {
                    newDownvotes++;
                    newUpvotes--;
                }
                newUserVote = isUpvote ? 'up' : 'down';
            } else {
                // New vote
                if (isUpvote) newUpvotes++;
                else newDownvotes++;
                newUserVote = isUpvote ? 'up' : 'down';
            }

            // Update local state optimistically
            setExperiences(prev =>
                prev.map(e =>
                    e.id === experienceId
                        ? { ...e, upvotes: newUpvotes, downvotes: newDownvotes, user_vote: newUserVote }
                        : e
                )
            );

            // Update in database
            await supabase
                .from('interview_experiences')
                .update({ upvotes: newUpvotes, downvotes: newDownvotes })
                .eq('id', experienceId);

        } catch (error) {
            console.error('Error voting:', error);
            fetchExperiences(); // Refresh on error
        }
    };

    const handleDelete = async (experienceId: string) => {
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from('interview_experiences')
                .delete()
                .eq('id', experienceId);

            if (error) throw error;

            setExperiences(prev => prev.filter(e => e.id !== experienceId));
        } catch (error) {
            console.error('Error deleting:', error);
        }
    };

    // Get unique companies for filter
    const companies = [...new Set(experiences.map(e => e.company))].sort();

    // Filter experiences
    const filteredExperiences = experiences.filter((exp) => {
        const matchesSearch =
            exp.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
            exp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
            exp.content.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesDomain = !selectedDomain || exp.domain === selectedDomain;
        const matchesCompany = !companyFilter || exp.company === companyFilter;

        return matchesSearch && matchesDomain && matchesCompany;
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
                    <h1 className="page-title">Interview Experiences</h1>
                    <p className="page-subtitle">Learn from your batchmates&apos; interview journeys</p>
                </div>
                <Link href="/interviews/new" className="btn btn-primary">
                    <PlusIcon />
                    Share Experience
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
                        placeholder="Search by company, role, or keywords..."
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
                    Filters {(selectedDomain || companyFilter) && `(${[selectedDomain, companyFilter].filter(Boolean).length})`}
                </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                    <div className="card-body">
                        <div style={{
                            display: 'grid',
                            gap: 'var(--space-lg)',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
                        }}>
                            {/* Domain Filter */}
                            <div>
                                <label className="label">Domain</label>
                                <select
                                    className="input select"
                                    value={selectedDomain}
                                    onChange={(e) => setSelectedDomain(e.target.value)}
                                >
                                    <option value="">All Domains</option>
                                    {DOMAINS.map((domain) => (
                                        <option key={domain} value={domain}>{domain}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Company Filter */}
                            <div>
                                <label className="label">Company</label>
                                <select
                                    className="input select"
                                    value={companyFilter}
                                    onChange={(e) => setCompanyFilter(e.target.value)}
                                >
                                    <option value="">All Companies</option>
                                    {companies.map((company) => (
                                        <option key={company} value={company}>{company}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Clear Filters */}
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button
                                    className="btn btn-ghost"
                                    onClick={() => {
                                        setSelectedDomain('');
                                        setCompanyFilter('');
                                    }}
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Results Info */}
            <div style={{
                marginBottom: 'var(--space-lg)',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)'
            }}>
                Showing {filteredExperiences.length} experience{filteredExperiences.length !== 1 ? 's' : ''}
            </div>

            {/* Experiences List */}
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="card">
                            <div className="card-body">
                                <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                                    <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                                    <div>
                                        <div className="skeleton" style={{ width: '120px', height: '16px', marginBottom: '0.5rem' }} />
                                        <div className="skeleton" style={{ width: '80px', height: '12px' }} />
                                    </div>
                                </div>
                                <div className="skeleton" style={{ width: '60%', height: '24px', marginBottom: 'var(--space-sm)' }} />
                                <div className="skeleton" style={{ width: '100%', height: '80px' }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredExperiences.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    {filteredExperiences.map((experience) => (
                        <InterviewCard
                            key={experience.id}
                            experience={experience}
                            currentUserId={currentUserId}
                            onVote={handleVote}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <BriefcaseIcon />
                    <h3 style={{ marginTop: 'var(--space-lg)' }}>No interview experiences yet</h3>
                    <p style={{ marginBottom: 'var(--space-lg)' }}>
                        Be the first to share your interview experience!
                    </p>
                    <Link href="/interviews/new" className="btn btn-primary">
                        <PlusIcon />
                        Share Your Experience
                    </Link>
                </div>
            )}
        </div>
    );
}
