'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { InterviewExperience } from '@/types';
import { CompanyLogo } from '@/components/ui';

// Icons
const ArrowLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 19-7-7 7-7"></path>
        <path d="M19 12H5"></path>
    </svg>
);

const ThumbsUpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 10v12"></path>
        <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"></path>
    </svg>
);

const ThumbsDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 14V2"></path>
        <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"></path>
    </svg>
);

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
        <path d="m15 5 4 4"></path>
    </svg>
);

const LoaderIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
    </svg>
);

export default function InterviewExperiencePage() {
    const params = useParams();
    const router = useRouter();
    const [experience, setExperience] = useState<InterviewExperience | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string>();

    useEffect(() => {
        fetchExperience();
        fetchCurrentUser();
    }, [params.id]);

    const fetchCurrentUser = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id);
    };

    const fetchExperience = async () => {
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('interview_experiences')
                .select(`
                    *,
                    user:users(id, name, email, profile_picture, linkedin_url)
                `)
                .eq('id', params.id)
                .single();

            if (error) throw error;
            setExperience(data);
        } catch (err) {
            console.error('Error fetching experience:', err);
            setError('Interview experience not found');
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (isUpvote: boolean) => {
        if (!currentUserId || !experience) return;

        try {
            const supabase = createClient();
            const currentVote = experience.user_vote;
            let newUpvotes = experience.upvotes;
            let newDownvotes = experience.downvotes;
            let newUserVote: 'up' | 'down' | null = null;

            if (currentVote === (isUpvote ? 'up' : 'down')) {
                if (isUpvote) newUpvotes--;
                else newDownvotes--;
                newUserVote = null;
            } else if (currentVote === (isUpvote ? 'down' : 'up')) {
                if (isUpvote) {
                    newUpvotes++;
                    newDownvotes--;
                } else {
                    newDownvotes++;
                    newUpvotes--;
                }
                newUserVote = isUpvote ? 'up' : 'down';
            } else {
                if (isUpvote) newUpvotes++;
                else newDownvotes++;
                newUserVote = isUpvote ? 'up' : 'down';
            }

            setExperience({
                ...experience,
                upvotes: newUpvotes,
                downvotes: newDownvotes,
                user_vote: newUserVote
            });

            await supabase
                .from('interview_experiences')
                .update({ upvotes: newUpvotes, downvotes: newDownvotes })
                .eq('id', experience.id);

        } catch (error) {
            console.error('Error voting:', error);
            fetchExperience();
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
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

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <LoaderIcon />
            </div>
        );
    }

    if (error || !experience) {
        return (
            <div style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
                <h2 style={{ marginBottom: 'var(--space-md)' }}>Experience Not Found</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
                    The interview experience you&apos;re looking for doesn&apos;t exist or has been removed.
                </p>
                <Link href="/interviews" className="btn btn-primary">
                    <ArrowLeftIcon />
                    Back to Experiences
                </Link>
            </div>
        );
    }

    const isOwner = currentUserId === experience.user_id;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Back Button */}
            <Link
                href="/interviews"
                className="btn btn-ghost"
                style={{ marginBottom: 'var(--space-lg)', display: 'inline-flex' }}
            >
                <ArrowLeftIcon />
                Back to Experiences
            </Link>

            {/* Main Card */}
            <div className="card">
                <div className="card-body" style={{ padding: 'var(--space-xl)' }}>
                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 'var(--space-lg)'
                    }}>
                        {/* Author Info */}
                        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
                            {experience.user?.profile_picture ? (
                                <img
                                    src={experience.user.profile_picture}
                                    alt={experience.user.name}
                                    className="avatar avatar-lg"
                                />
                            ) : (
                                <div className="avatar avatar-lg avatar-placeholder">
                                    {getInitials(experience.user?.name || 'U')}
                                </div>
                            )}
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '1.125rem', color: 'var(--text-primary)' }}>
                                    {experience.user?.name || 'Anonymous'}
                                </div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                    {formatDate(experience.created_at)}
                                </div>
                            </div>
                        </div>

                        {/* Edit Button */}
                        {isOwner && (
                            <Link
                                href={`/interviews/${experience.id}/edit`}
                                className="btn btn-secondary"
                            >
                                <EditIcon />
                                Edit
                            </Link>
                        )}
                    </div>

                    {/* Company & Role */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-md)',
                        marginBottom: 'var(--space-sm)'
                    }}>
                        <CompanyLogo company={experience.company} size="xl" />
                        <div>
                            <h1 style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                margin: 0
                            }}>
                                {experience.company}
                            </h1>
                            <p style={{
                                fontSize: '1.125rem',
                                color: 'var(--text-secondary)',
                                margin: 0
                            }}>
                                {experience.role}
                            </p>
                        </div>
                    </div>

                    {/* Tags */}
                    <div style={{
                        display: 'flex',
                        gap: 'var(--space-sm)',
                        marginBottom: 'var(--space-xl)',
                        flexWrap: 'wrap'
                    }}>
                        <span className="badge badge-primary">{experience.role}</span>
                        <span className="badge badge-accent">{experience.domain}</span>
                    </div>

                    {/* Divider */}
                    <div style={{
                        borderTop: '1px solid var(--border-light)',
                        marginBottom: 'var(--space-xl)'
                    }} />

                    {/* Content */}
                    <div style={{
                        fontSize: '1rem',
                        color: 'var(--text-primary)',
                        lineHeight: 1.8,
                        whiteSpace: 'pre-wrap'
                    }}>
                        {experience.content}
                    </div>



                    {/* Divider */}
                    <div style={{
                        borderTop: '1px solid var(--border-light)',
                        marginTop: 'var(--space-xl)',
                        marginBottom: 'var(--space-lg)'
                    }} />

                    {/* Footer - Voting */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                            <button
                                className={`vote-btn upvote ${experience.user_vote === 'up' ? 'active' : ''}`}
                                onClick={() => handleVote(true)}
                                style={{ padding: 'var(--space-sm) var(--space-md)' }}
                            >
                                <ThumbsUpIcon />
                                <span>Helpful ({experience.upvotes})</span>
                            </button>
                            <button
                                className={`vote-btn downvote ${experience.user_vote === 'down' ? 'active' : ''}`}
                                onClick={() => handleVote(false)}
                                style={{ padding: 'var(--space-sm) var(--space-md)' }}
                            >
                                <ThumbsDownIcon />
                                <span>({experience.downvotes})</span>
                            </button>
                        </div>

                        {/* Contact Author */}
                        {experience.user?.linkedin_url && (
                            <a
                                href={experience.user.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-secondary"
                            >
                                Connect on LinkedIn
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
