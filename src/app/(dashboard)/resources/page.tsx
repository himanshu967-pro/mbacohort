'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const FolderIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
    </svg>
);

const DriveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M8.5 2L15.5 2L22 14L15 14L8.5 2Z" fill="#0066DA" />
        <path d="M1.5 14L8.5 2L15.5 14L8.5 14L1.5 14Z" fill="#00AC47" />
        <path d="M8.5 14L15 14L18.5 21L12 21L8.5 14Z" fill="#EA4335" />
        <path d="M1.5 14L8.5 14L5 21L1.5 14Z" fill="#00832D" />
        <path d="M18.5 21L22 14L15 14L18.5 21Z" fill="#2684FC" />
        <path d="M5 21L8.5 14L12 21L5 21Z" fill="#FFBA00" />
    </svg>
);

const ExternalLinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
        <polyline points="15 3 21 3 21 9"></polyline>
        <line x1="10" x2="21" y1="14" y2="3"></line>
    </svg>
);

// Google Drive folder link for cohort study materials
const GOOGLE_DRIVE_URL = 'https://drive.google.com/drive/folders/1WceN-CGaDLZUkuoQMWjQvC65ZkHSj_66?usp=drive_link';
const GOOGLE_DRIVE_EMBED_URL = 'https://drive.google.com/embeddedfolderview?id=1WceN-CGaDLZUkuoQMWjQvC65ZkHSj_66#list';

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

            {/* Google Drive Section - Featured */}
            <div className="card" style={{
                marginBottom: 'var(--space-xl)',
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                border: '2px solid var(--primary-200)'
            }}>
                <div className="card-body" style={{ padding: 'var(--space-xl)' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 'var(--space-lg)',
                        flexWrap: 'wrap',
                        gap: 'var(--space-md)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: 'var(--radius-lg)',
                                background: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}>
                                <DriveIcon />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>📚 Cohort Study Materials</h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0, marginTop: '0.25rem' }}>
                                    Access all shared study materials on Google Drive
                                </p>
                            </div>
                        </div>
                        <a
                            href={GOOGLE_DRIVE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <ExternalLinkIcon />
                            Open in Google Drive
                        </a>
                    </div>

                    {/* Embedded Google Drive Folder */}
                    <div style={{
                        background: 'white',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                        border: '1px solid var(--border-light)'
                    }}>
                        <iframe
                            src={GOOGLE_DRIVE_EMBED_URL}
                            style={{
                                width: '100%',
                                height: '500px',
                                border: 'none'
                            }}
                            title="Study Materials - Google Drive"
                        />
                    </div>

                    <p style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        marginTop: 'var(--space-md)',
                        textAlign: 'center'
                    }}>
                        💡 Tip: Click "Open in Google Drive" for the best experience
                    </p>
                </div>
            </div>

            {/* Additional Resources Section */}
            <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>Other Resources</h2>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
                    <p>Loading resources...</p>
                </div>
            ) : resources.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
                    <div style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
                        <FolderIcon />
                    </div>
                    <h3 style={{ marginBottom: 'var(--space-sm)' }}>No Additional Resources</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Check the Google Drive folder above for all study materials.
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
