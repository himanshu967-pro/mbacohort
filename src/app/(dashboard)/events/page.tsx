'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

// Icons
const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
        <line x1="16" x2="16" y1="2" y2="6"></line>
        <line x1="8" x2="8" y1="2" y2="6"></line>
        <line x1="3" x2="21" y1="10" y2="10"></line>
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

const LocationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
        <circle cx="12" cy="10" r="3"></circle>
    </svg>
);

interface Event {
    id: string;
    title: string;
    description: string;
    event_date: string;
    end_date?: string;
    location?: string;
    event_type: string;
    created_by: string;
    created_at: string;
    creator?: { id: string; name: string; profile_picture?: string };
}

interface Comment {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    user?: { id: string; name: string; profile_picture?: string };
}

const EVENT_TYPES = [
    { value: 'academic', label: '📚 Academic', color: 'var(--primary-500)' },
    { value: 'social', label: '🎉 Social', color: 'var(--accent-500)' },
    { value: 'workshop', label: '💼 Workshop', color: 'var(--warning)' },
    { value: 'other', label: '📌 Other', color: 'var(--text-muted)' },
];

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
    const [comments, setComments] = useState<Record<string, Comment[]>>({});
    const [newComment, setNewComment] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string>();

    useEffect(() => {
        fetchEvents();
        fetchCurrentUser();
    }, []);

    const fetchCurrentUser = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id);
    };

    const fetchEvents = async () => {
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('events')
                .select(`*, creator:users(id, name, profile_picture)`)
                .order('event_date', { ascending: true });

            if (error) throw error;
            setEvents(data || []);
        } catch (err) {
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async (eventId: string) => {
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('comments')
                .select(`*, user:users(id, name, profile_picture)`)
                .eq('parent_type', 'event')
                .eq('parent_id', eventId)
                .order('created_at', { ascending: true });

            if (!error && data) {
                setComments(prev => ({ ...prev, [eventId]: data }));
            }
        } catch (err) {
            console.error('Error fetching comments:', err);
        }
    };

    const handleAddComment = async (eventId: string) => {
        if (!newComment.trim() || !currentUserId) return;

        try {
            const supabase = createClient();
            const { error } = await supabase.from('comments').insert({
                user_id: currentUserId,
                content: newComment.trim(),
                parent_type: 'event',
                parent_id: eventId
            });

            if (!error) {
                setNewComment('');
                fetchComments(eventId);
            }
        } catch (err) {
            console.error('Error adding comment:', err);
        }
    };

    const toggleComments = (eventId: string) => {
        if (expandedEvent === eventId) {
            setExpandedEvent(null);
        } else {
            setExpandedEvent(eventId);
            if (!comments[eventId]) {
                fetchComments(eventId);
            }
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getEventTypeInfo = (type: string) => {
        return EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[3];
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
                <div>
                    <h1 style={{ fontSize: '1.75rem', marginBottom: 'var(--space-xs)' }}>Events</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Upcoming events, workshops, and gatherings for the cohort
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    <PlusIcon />
                    Create Event
                </button>
            </div>

            {/* Events List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
                    <p>Loading events...</p>
                </div>
            ) : events.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
                    <div style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
                        <CalendarIcon />
                    </div>
                    <h3 style={{ marginBottom: 'var(--space-sm)' }}>No Events Yet</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
                        Be the first to create an event for the cohort!
                    </p>
                    <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                        <PlusIcon />
                        Create Event
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    {events.map((event) => {
                        const typeInfo = getEventTypeInfo(event.event_type);
                        const isExpanded = expandedEvent === event.id;
                        const eventComments = comments[event.id] || [];

                        return (
                            <div key={event.id} className="card">
                                <div className="card-body">
                                    {/* Event Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                                        <span className="badge" style={{ background: typeInfo.color, color: 'white' }}>
                                            {typeInfo.label}
                                        </span>
                                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                            {formatDate(event.event_date)}
                                        </span>
                                    </div>

                                    {/* Event Title & Description */}
                                    <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-sm)' }}>{event.title}</h2>
                                    {event.description && (
                                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)', lineHeight: 1.6 }}>
                                            {event.description}
                                        </p>
                                    )}

                                    {/* Location */}
                                    {event.location && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)', color: 'var(--text-secondary)' }}>
                                            <LocationIcon />
                                            <span style={{ fontSize: '0.875rem' }}>{event.location}</span>
                                        </div>
                                    )}

                                    {/* Footer */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        paddingTop: 'var(--space-md)',
                                        borderTop: '1px solid var(--border-light)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                            {event.creator?.profile_picture ? (
                                                <img src={event.creator.profile_picture} alt="" className="avatar avatar-sm" />
                                            ) : (
                                                <div className="avatar avatar-sm avatar-placeholder" style={{ width: '24px', height: '24px', fontSize: '0.625rem' }}>
                                                    {getInitials(event.creator?.name || 'U')}
                                                </div>
                                            )}
                                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                by <strong>{event.creator?.name || 'Unknown'}</strong>
                                            </span>
                                        </div>

                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => toggleComments(event.id)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                        >
                                            <MessageIcon />
                                            {eventComments.length > 0 ? `${eventComments.length} Comments` : 'Comment'}
                                        </button>
                                    </div>

                                    {/* Comments Section */}
                                    {isExpanded && (
                                        <div style={{ marginTop: 'var(--space-lg)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--border-light)' }}>
                                            {/* Comments List */}
                                            {eventComments.length > 0 && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                                                    {eventComments.map(comment => (
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

                                            {/* Add Comment */}
                                            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                                <input
                                                    type="text"
                                                    className="input"
                                                    placeholder="Write a comment..."
                                                    value={newComment}
                                                    onChange={e => setNewComment(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleAddComment(event.id)}
                                                    style={{ flex: 1 }}
                                                />
                                                <button className="btn btn-primary" onClick={() => handleAddComment(event.id)}>
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
            )}

            {/* Create Event Modal */}
            {showCreateModal && (
                <CreateEventModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => {
                        setShowCreateModal(false);
                        fetchEvents();
                    }}
                />
            )}
        </div>
    );
}

function CreateEventModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        event_date: '',
        event_time: '',
        location: '',
        event_type: 'other'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.event_date) {
            setError('Title and date are required');
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

            const eventDateTime = formData.event_time
                ? `${formData.event_date}T${formData.event_time}:00`
                : `${formData.event_date}T09:00:00`;

            const { error: insertError } = await supabase.from('events').insert({
                title: formData.title,
                description: formData.description || null,
                event_date: eventDateTime,
                location: formData.location || null,
                event_type: formData.event_type,
                created_by: user.id
            });

            if (insertError) throw insertError;
            onCreated();
        } catch (err: any) {
            setError(err.message || 'Failed to create event');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h3 className="modal-title">Create Event</h3>
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
                            <label className="label">Event Title *</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="e.g., Study Group Session"
                                value={formData.title}
                                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            />
                        </div>

                        <div className="input-group">
                            <label className="label">Description</label>
                            <textarea
                                className="input"
                                rows={3}
                                placeholder="What's this event about?"
                                value={formData.description}
                                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                            <div className="input-group">
                                <label className="label">Date *</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={formData.event_date}
                                    onChange={e => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                                />
                            </div>
                            <div className="input-group">
                                <label className="label">Time</label>
                                <input
                                    type="time"
                                    className="input"
                                    value={formData.event_time}
                                    onChange={e => setFormData(prev => ({ ...prev, event_time: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="label">Location</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="e.g., Room 101 or Zoom link"
                                value={formData.location}
                                onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                            />
                        </div>

                        <div className="input-group">
                            <label className="label">Event Type</label>
                            <select
                                className="input select"
                                value={formData.event_type}
                                onChange={e => setFormData(prev => ({ ...prev, event_type: e.target.value }))}
                            >
                                {EVENT_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
