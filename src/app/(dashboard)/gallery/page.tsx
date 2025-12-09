'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const ImageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
        <circle cx="9" cy="9" r="2"></circle>
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
    </svg>
);

export default function GalleryPage() {
    const [images, setImages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGallery();
    }, []);

    const fetchGallery = async () => {
        try {
            const supabase = createClient();
            const { data } = await supabase
                .from('gallery_images')
                .select('*')
                .order('created_at', { ascending: false });
            setImages(data || []);
        } catch (err) {
            console.error('Error fetching gallery:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: 'var(--space-xl)' }}>
                <h1 style={{ fontSize: '1.75rem', marginBottom: 'var(--space-xs)' }}>Gallery</h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Photos and memories from cohort events and activities
                </p>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
                    <p>Loading gallery...</p>
                </div>
            ) : images.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
                    <div style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
                        <ImageIcon />
                    </div>
                    <h3 style={{ marginBottom: 'var(--space-sm)' }}>No Photos Yet</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Photos from events and activities will appear here.
                    </p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: 'var(--space-md)'
                }}>
                    {images.map((img) => (
                        <div key={img.id} className="card" style={{ overflow: 'hidden' }}>
                            <img
                                src={img.image_url}
                                alt={img.caption || 'Gallery image'}
                                style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                            />
                            {img.caption && (
                                <div className="card-body" style={{ padding: 'var(--space-sm)' }}>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        {img.caption}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
