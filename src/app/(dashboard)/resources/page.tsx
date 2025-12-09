'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const FolderIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
    </svg>
);

export default function ResourcesPage() {
    const [resources, setResources] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        try {
            const supabase = createClient();
            const { data } = await supabase
                .from('resources')
                .select('*')
                .order('created_at', { ascending: false });
            setResources(data || []);
        } catch (err) {
            console.error('Error fetching resources:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: 'var(--space-xl)' }}>
                <h1 style={{ fontSize: '1.75rem', marginBottom: 'var(--space-xs)' }}>Study Materials</h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Shared resources, study materials, and useful documents
                </p>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
                    <p>Loading resources...</p>
                </div>
            ) : resources.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
                    <div style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
                        <FolderIcon />
                    </div>
                    <h3 style={{ marginBottom: 'var(--space-sm)' }}>No Resources Yet</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Study materials and shared resources will appear here.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 'var(--space-md)', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                    {resources.map((resource) => (
                        <div key={resource.id} className="card">
                            <div className="card-body">
                                <h3 style={{ fontSize: '1rem' }}>{resource.title}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--space-sm)' }}>
                                    {resource.description}
                                </p>
                                <span className="badge">{resource.category}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
