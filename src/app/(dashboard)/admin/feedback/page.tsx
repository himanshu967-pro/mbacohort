'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Feedback } from '@/types';

// Icons
const ArrowLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5"></path>
        <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
);

const MessageSquareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18"></path>
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
    </svg>
);

export default function AdminFeedbackPage() {
    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    useEffect(() => {
        fetchFeedback();
    }, []);

    const fetchFeedback = async () => {
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('feedback')
                .select(`
          *,
          user:users(id, name, email, profile_picture)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setFeedback(data || []);
        } catch (error) {
            console.error('Error fetching feedback:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from('feedback')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setFeedback(prev => prev.filter(f => f.id !== id));
        } catch (error) {
            console.error('Error deleting:', error);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getCategoryBadge = (category?: string) => {
        switch (category) {
            case 'bug':
                return <span className="badge badge-error">Bug Report</span>;
            case 'feature':
                return <span className="badge badge-primary">Feature Request</span>;
            default:
                return <span className="badge badge-accent">General</span>;
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const filteredFeedback = feedback.filter(f =>
        !selectedCategory || f.category === selectedCategory
    );

    return (
        <div>
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
                <h1 className="page-title">User Feedback</h1>
                <p className="page-subtitle">Review submitted feedback from cohort members</p>
            </div>

            {/* Filter Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${!selectedCategory ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('')}
                >
                    All ({feedback.length})
                </button>
                <button
                    className={`tab ${selectedCategory === 'bug' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('bug')}
                >
                    Bugs ({feedback.filter(f => f.category === 'bug').length})
                </button>
                <button
                    className={`tab ${selectedCategory === 'feature' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('feature')}
                >
                    Features ({feedback.filter(f => f.category === 'feature').length})
                </button>
                <button
                    className={`tab ${selectedCategory === 'general' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('general')}
                >
                    General ({feedback.filter(f => f.category === 'general' || !f.category).length})
                </button>
            </div>

            {/* Feedback List */}
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="card">
                            <div className="card-body">
                                <div className="skeleton" style={{ width: '60%', height: '20px', marginBottom: 'var(--space-md)' }} />
                                <div className="skeleton" style={{ width: '100%', height: '60px' }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredFeedback.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {filteredFeedback.map((item) => (
                        <div key={item.id} className="card">
                            <div className="card-body">
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    marginBottom: 'var(--space-md)'
                                }}>
                                    <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
                                        {item.user?.profile_picture ? (
                                            <img
                                                src={item.user.profile_picture}
                                                alt={item.user.name}
                                                className="avatar"
                                            />
                                        ) : (
                                            <div className="avatar avatar-placeholder">
                                                {getInitials(item.user?.name || 'U')}
                                            </div>
                                        )}
                                        <div>
                                            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                                {item.user?.name || 'Unknown User'}
                                            </div>
                                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                                {item.user?.email} • {formatDate(item.created_at)}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                        {getCategoryBadge(item.category)}
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            style={{ padding: '0.375rem', color: 'var(--error)' }}
                                            onClick={() => handleDelete(item.id)}
                                            title="Delete"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </div>

                                <p style={{
                                    color: 'var(--text-secondary)',
                                    lineHeight: 1.6,
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {item.message}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <MessageSquareIcon />
                    <h3 style={{ marginTop: 'var(--space-lg)' }}>No feedback yet</h3>
                    <p>Users haven&apos;t submitted any feedback in this category</p>
                </div>
            )}
        </div>
    );
}
