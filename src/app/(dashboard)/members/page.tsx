'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { User, DOMAINS } from '@/types';
import { CompanyLogo } from '@/components/ui';

// Icons
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.3-4.3"></path>
    </svg>
);

const LinkedInIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
);

const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="16" x="2" y="4" rx="2"></rect>
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
    </svg>
);

const FilterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
    </svg>
);

interface MemberCardProps {
    member: User;
}

function MemberCard({ member }: MemberCardProps) {
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
                alignItems: 'center',
                textAlign: 'center',
                padding: 'var(--space-xl)'
            }}>
                {/* Avatar */}
                {member.profile_picture ? (
                    <img
                        src={member.profile_picture}
                        alt={member.name}
                        className="avatar avatar-xl"
                        style={{ marginBottom: 'var(--space-lg)' }}
                    />
                ) : (
                    <div
                        className="avatar avatar-xl avatar-placeholder"
                        style={{ marginBottom: 'var(--space-lg)' }}
                    >
                        {getInitials(member.name)}
                    </div>
                )}

                {/* Name */}
                <h3 style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    marginBottom: 'var(--space-xs)',
                    color: 'var(--text-primary)'
                }}>
                    {member.name}
                </h3>

                {/* Domain/Specialization */}
                {member.domain && (
                    <span className="badge badge-primary" style={{ marginBottom: 'var(--space-sm)' }}>
                        {member.domain}
                    </span>
                )}

                {/* Company with Logo */}
                {member.company && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-sm)',
                        marginBottom: 'var(--space-md)'
                    }}>
                        <CompanyLogo
                            company={member.company.split(',')[0].trim()}
                            size="sm"
                        />
                        <p style={{
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)',
                            margin: 0
                        }}>
                            {member.company.split(',')[0].trim()}
                        </p>
                    </div>
                )}

                {/* Bio (truncated) */}
                {member.bio && (
                    <p style={{
                        fontSize: '0.8125rem',
                        color: 'var(--text-muted)',
                        marginBottom: 'var(--space-lg)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}>
                        {member.bio}
                    </p>
                )}

                {/* Actions */}
                <div style={{
                    display: 'flex',
                    gap: 'var(--space-sm)',
                    marginTop: 'auto'
                }}>
                    {member.linkedin_url && (
                        <a
                            href={member.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '0.5rem' }}
                            title="LinkedIn Profile"
                        >
                            <LinkedInIcon />
                        </a>
                    )}
                    <a
                        href={`mailto:${member.email}`}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '0.5rem' }}
                        title="Send Email"
                    >
                        <MailIcon />
                    </a>
                    <Link
                        href={`/members/${member.id}`}
                        className="btn btn-secondary btn-sm"
                    >
                        View Profile
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function MembersPage() {
    const [members, setMembers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDomain, setSelectedDomain] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('name');

            if (error) throw error;
            setMembers(data || []);
        } catch (error) {
            console.error('Error fetching members:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter members based on search and domain
    const filteredMembers = members.filter((member) => {
        const matchesSearch =
            member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (member.company?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (member.specialization?.toLowerCase() || '').includes(searchQuery.toLowerCase());

        const matchesDomain = !selectedDomain || member.domain === selectedDomain;

        return matchesSearch && matchesDomain;
    });

    return (
        <div>
            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-title">Cohort Members</h1>
                <p className="page-subtitle">Connect with your 67 batchmates</p>
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
                        placeholder="Search by name, company, or specialization..."
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
                Showing {filteredMembers.length} of {members.length} members
            </div>

            {/* Members Grid */}
            {loading ? (
                <div className="grid-members stagger">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="card">
                            <div className="card-body" style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: 'var(--space-xl)'
                            }}>
                                <div className="skeleton" style={{
                                    width: '96px',
                                    height: '96px',
                                    borderRadius: '50%',
                                    marginBottom: 'var(--space-lg)'
                                }} />
                                <div className="skeleton" style={{
                                    width: '120px',
                                    height: '20px',
                                    marginBottom: 'var(--space-sm)'
                                }} />
                                <div className="skeleton" style={{
                                    width: '80px',
                                    height: '24px',
                                    borderRadius: 'var(--radius-full)'
                                }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredMembers.length > 0 ? (
                <div className="grid-members stagger">
                    {filteredMembers.map((member) => (
                        <MemberCard key={member.id} member={member} />
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <SearchIcon />
                    <h3 style={{ marginTop: 'var(--space-lg)' }}>No members found</h3>
                    <p>Try adjusting your search or filter criteria</p>
                </div>
            )}
        </div>
    );
}
