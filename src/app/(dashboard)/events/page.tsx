'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
        <line x1="16" x2="16" y1="2" y2="6"></line>
        <line x1="8" x2="8" y1="2" y2="6"></line>
        <line x1="3" x2="21" y1="10" y2="10"></line>
    </svg>
);

export default function EventsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const supabase = createClient();
            const { data } = await supabase
                .from('events')
                .select('*')
                .order('event_date', { ascending: true });
            setEvents(data || []);
        } catch (err) {
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: 'var(--space-xl)' }}>
                <h1 style={{ fontSize: '1.75rem', marginBottom: 'var(--space-xs)' }}>Events</h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Upcoming events, workshops, and gatherings for the cohort
                </p>
            </div>

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
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Events will appear here once they are scheduled.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                    {events.map((event) => (
                        <div key={event.id} className="card">
                            <div className="card-body">
                                <h3>{event.title}</h3>
                                <p style={{ color: 'var(--text-secondary)' }}>{event.description}</p>
                                <div className="badge">{new Date(event.event_date).toLocaleDateString()}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
