'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('announcements')
                .select(`
          *,
          creator:users(id, name, profile_picture)
        `)
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
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

    return (
        <div>
            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-title">Announcements</h1>
                <p className="page-subtitle">Important updates and notices for the cohort</p>
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
                    {announcements.map((announcement) => (
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
                                    alignItems: 'center',
                                    gap: 'var(--space-sm)',
                                    paddingTop: 'var(--space-md)',
                                    borderTop: '1px solid var(--border-light)'
                                }}>
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
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <BellIcon />
                    <h3 style={{ marginTop: 'var(--space-lg)' }}>No announcements yet</h3>
                    <p>Check back later for important updates</p>
                </div>
            )}
        </div>
    );
}
