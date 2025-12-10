'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Announcement } from '@/types';

// Icons
const BellIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
    </svg>
);

const PinIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" x2="12" y1="17" y2="22"></line>
        <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14"></path>
        <path d="M5 12h14"></path>
    </svg>
);

const MessageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6 6 18"></path>
        <path d="m6 6 12 12"></path>
    </svg>
);

interface Comment {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    user?: { id: string; name: string; profile_picture?: string };
}

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [expandedItem, setExpandedItem] = useState<string | null>(null);
    const [comments, setComments] = useState<Record<string, Comment[]>>({});
    const [newComment, setNewComment] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string>();

    useEffect(() => {
        fetchAnnouncements();
        fetchCurrentUser();
    }, []);

    const fetchCurrentUser = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id);
    };

    const fetchAnnouncements = async () => {
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('announcements')
                .select(`*, creator:users(id, name, profile_picture)`)
                .order('is_pinned', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAnnouncements(data || []);
        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async (announcementId: string) => {
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('comments')
                .select(`*, user:users(id, name, profile_picture)`)
                .eq('parent_type', 'announcement')
                .eq('parent_id', announcementId)
                .order('created_at', { ascending: true });

            if (!error && data) {
                setComments(prev => ({ ...prev, [announcementId]: data }));
            }
        } catch (err) {
            console.error('Error fetching comments:', err);
        }
    };

    const handleAddComment = async (announcementId: string) => {
        if (!newComment.trim() || !currentUserId) return;

        try {
            const supabase = createClient();
            const { error } = await supabase.from('comments').insert({
                user_id: currentUserId,
                content: newComment.trim(),
                parent_type: 'announcement',
                parent_id: announcementId
            });

            if (!error) {
                setNewComment('');
                fetchComments(announcementId);
            }
        } catch (err) {
            console.error('Error adding comment:', err);
        }
    };

    const toggleComments = (announcementId: string) => {
        if (expandedItem === announcementId) {
            setExpandedItem(null);
        } else {
            setExpandedItem(announcementId);
            if (!comments[announcementId]) {
                fetchComments(announcementId);
            }
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

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
                    <h1 className="page-title">Announcements</h1>
                    <p className="page-subtitle">Important updates and notices for the cohort</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    <PlusIcon />
                    Post Announcement
                </button>
            </div>

            {/* Announcements List */}
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="card">
                            <div className="card-body">
                                <div className="skeleton" style={{ width: '60%', height: '24px', marginBottom: 'var(--space-md)' }} />
                                <div className="skeleton" style={{ width: '100%', height: '60px', marginBottom: 'var(--space-md)' }} />
                                <div className="skeleton" style={{ width: '30%', height: '16px' }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : announcements.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    {announcements.map((announcement) => {
                        const isExpanded = expandedItem === announcement.id;
                        const itemComments = comments[announcement.id] || [];

                        return (
                            <div
                                key={announcement.id}
                                className="card"
                                style={announcement.is_pinned ? {
                                    borderColor: 'var(--primary-300)',
                                    background: 'var(--primary-50)'
                                } : {}}
                            >
                                <div className="card-body">
                                    {/* Header */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: 'var(--space-md)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                            {announcement.is_pinned && (
                                                <span className="badge badge-primary" style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem'
                                                }}>
                                                    <PinIcon />
                                                    Pinned
                                                </span>
                                            )}
                                        </div>
                                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                            {formatDate(announcement.created_at)}
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <h2 style={{
                                        fontSize: '1.25rem',
                                        fontWeight: 600,
                                        marginBottom: 'var(--space-md)',
                                        color: 'var(--text-primary)'
                                    }}>
                                        {announcement.title}
                                    </h2>

                                    {/* Content */}
                                    <p style={{
                                        color: 'var(--text-secondary)',
                                        lineHeight: 1.7,
                                        whiteSpace: 'pre-wrap',
                                        marginBottom: 'var(--space-lg)'
                                    }}>
                                        {announcement.content}
                                    </p>

                                    {/* Footer */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        paddingTop: 'var(--space-md)',
                                        borderTop: '1px solid var(--border-light)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                            {announcement.creator?.profile_picture ? (
                                                <img
                                                    src={announcement.creator.profile_picture}
                                                    alt={announcement.creator.name}
                                                    className="avatar avatar-sm"
                                                />
                                            ) : (
                                                <div
                                                    className="avatar avatar-sm avatar-placeholder"
                                                    style={{ width: '24px', height: '24px', fontSize: '0.625rem' }}
                                                >
                                                    {getInitials(announcement.creator?.name || 'A')}
                                                </div>
                                            )}
                                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                Posted by <strong>{announcement.creator?.name || 'Admin'}</strong>
                                            </span>
                                        </div>

                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => toggleComments(announcement.id)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                        >
                                            <MessageIcon />
                                            {itemComments.length > 0 ? `${itemComments.length} Comments` : 'Comment'}
                                        </button>
                                    </div>

                                    {/* Comments Section */}
                                    {isExpanded && (
                                        <div style={{ marginTop: 'var(--space-lg)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--border-light)' }}>
                                            {itemComments.length > 0 && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                                                    {itemComments.map(comment => (
                                                        <div key={comment.id} style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                                            {comment.user?.profile_picture ? (
                                                                <img src={comment.user.profile_picture} alt="" className="avatar avatar-sm" />
                                                            ) : (
                                                                <div className="avatar avatar-sm avatar-placeholder" style={{ width: '28px', height: '28px', fontSize: '0.625rem' }}>
                                                                    {getInitials(comment.user?.name || 'U')}
                                                                </div>
                                                            )}
                                                            <div style={{ flex: 1, background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-sm) var(--space-md)' }}>
                                                                <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{comment.user?.name}</div>
                                                                <p style={{ fontSize: '0.875rem', margin: 0 }}>{comment.content}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                                <input
                                                    type="text"
                                                    className="input"
                                                    placeholder="Write a comment..."
                                                    value={newComment}
                                                    onChange={e => setNewComment(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleAddComment(announcement.id)}
                                                    style={{ flex: 1 }}
                                                />
                                                <button className="btn btn-primary" onClick={() => handleAddComment(announcement.id)}>
                                                    Post
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="empty-state">
                    <BellIcon />
                    <h3 style={{ marginTop: 'var(--space-lg)' }}>No announcements yet</h3>
                    <p style={{ marginBottom: 'var(--space-lg)' }}>Be the first to share something with the cohort!</p>
                    <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                        <PlusIcon />
                        Post Announcement
                    </button>
                </div>
            )}

            {/* Create Announcement Modal */}
            {showCreateModal && (
                <CreateAnnouncementModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => {
                        setShowCreateModal(false);
                        fetchAnnouncements();
                    }}
                />
            )}
        </div>
    );
}

function CreateAnnouncementModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        content: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.content) {
            setError('Title and content are required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setError('You must be logged in');
                return;
            }

            const { error: insertError } = await supabase.from('announcements').insert({
                title: formData.title,
                content: formData.content,
                created_by: user.id,
                is_pinned: false
            });

            if (insertError) throw insertError;
            onCreated();
        } catch (err: any) {
            setError(err.message || 'Failed to create announcement');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h3 className="modal-title">Post Announcement</h3>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}><CloseIcon /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && (
                            <div style={{ padding: 'var(--space-sm)', background: 'var(--error-light)', color: '#991b1b', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)', fontSize: '0.875rem' }}>
                                {error}
                            </div>
                        )}

                        <div className="input-group">
                            <label className="label">Title *</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="Announcement title"
                                value={formData.title}
                                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            />
                        </div>

                        <div className="input-group">
                            <label className="label">Content *</label>
                            <textarea
                                className="input"
                                rows={5}
                                placeholder="What would you like to announce?"
                                value={formData.content}
                                onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Posting...' : 'Post Announcement'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
