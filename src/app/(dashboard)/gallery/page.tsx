'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface GalleryImage {
    id: string;
    album_name: string;
    image_url: string;
    caption: string;
    created_at: string;
}

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const ChevronLeft = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
);

const ChevronRight = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
);

export default function GalleryPage() {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [showUpload, setShowUpload] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const fetchGallery = useCallback(async () => {
        try {
            const supabase = createClient();
            const { data } = await supabase
                .from('gallery')
                .select('*')
                .order('created_at', { ascending: false });
            setImages(data || []);
        } catch (err) {
            console.error('Error fetching gallery:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGallery();
        const checkAuth = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setIsAuthenticated(!!user);
        };
        checkAuth();
    }, [fetchGallery]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (selectedIndex === null) return;
        if (e.key === 'Escape') setSelectedIndex(null);
        if (e.key === 'ArrowLeft') setSelectedIndex((selectedIndex - 1 + images.length) % images.length);
        if (e.key === 'ArrowRight') setSelectedIndex((selectedIndex + 1) % images.length);
    }, [selectedIndex, images.length]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const selectedImage = selectedIndex !== null ? images[selectedIndex] : null;

    return (
        <div className="bento-gallery">
            {loading ? (
                <div className="bento-grid">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className={`bento-item bento-size-${(i % 4) + 1} skeleton`} />
                    ))}
                </div>
            ) : images.length === 0 ? (
                <div className="bento-empty">
                    <p>No photos yet. Be the first to share!</p>
                </div>
            ) : (
                <div className="bento-grid">
                    {images.map((image, index) => (
                        <div
                            key={image.id}
                            className={`bento-item bento-size-${(index % 6) + 1}`}
                            onClick={() => setSelectedIndex(index)}
                        >
                            <img
                                src={image.image_url}
                                alt=""
                                loading="lazy"
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Floating Upload Button */}
            {isAuthenticated && (
                <button
                    className="bento-fab"
                    onClick={() => setShowUpload(true)}
                    aria-label="Upload photos"
                >
                    <PlusIcon />
                </button>
            )}

            {/* Lightbox */}
            {selectedImage && (
                <div className="bento-lightbox" onClick={() => setSelectedIndex(null)}>
                    <button className="bento-lightbox-close" onClick={() => setSelectedIndex(null)}>
                        <CloseIcon />
                    </button>

                    {images.length > 1 && (
                        <>
                            <button
                                className="bento-lightbox-nav bento-lightbox-prev"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedIndex((selectedIndex! - 1 + images.length) % images.length);
                                }}
                            >
                                <ChevronLeft />
                            </button>
                            <button
                                className="bento-lightbox-nav bento-lightbox-next"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedIndex((selectedIndex! + 1) % images.length);
                                }}
                            >
                                <ChevronRight />
                            </button>
                        </>
                    )}

                    <div className="bento-lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <img src={selectedImage.image_url} alt="" />
                        {selectedImage.caption && (
                            <div className="bento-lightbox-caption">
                                <p>{selectedImage.caption}</p>
                                <span>{selectedImage.album_name} • {new Date(selectedImage.created_at).toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Upload Modal */}
            {showUpload && (
                <UploadModal
                    onClose={() => setShowUpload(false)}
                    onComplete={() => { fetchGallery(); setShowUpload(false); }}
                />
            )}
        </div>
    );
}

function UploadModal({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleUpload = async () => {
        if (files.length === 0) return;
        setUploading(true);

        for (let i = 0; i < files.length; i++) {
            const formData = new FormData();
            formData.append('file', files[i]);
            formData.append('album', 'Gallery');

            await fetch('/api/gallery/upload', { method: 'POST', body: formData });
            setProgress(Math.round(((i + 1) / files.length) * 100));
        }

        onComplete();
    };

    return (
        <div className="bento-upload-overlay" onClick={onClose}>
            <div className="bento-upload-modal" onClick={(e) => e.stopPropagation()}>
                <div className="bento-upload-header">
                    <h3>Upload Photos</h3>
                    <button onClick={onClose}><CloseIcon /></button>
                </div>

                <div
                    className="bento-upload-drop"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        const newFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                        setFiles(prev => [...prev, ...newFiles]);
                    }}
                    onClick={() => document.getElementById('file-input')?.click()}
                >
                    <input
                        id="file-input"
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={(e) => {
                            const newFiles = Array.from(e.target.files || []);
                            setFiles(prev => [...prev, ...newFiles]);
                        }}
                    />
                    <p>Drop photos here or click to browse</p>
                </div>

                {files.length > 0 && (
                    <div className="bento-upload-preview">
                        {files.map((file, i) => (
                            <div key={i} className="bento-upload-thumb">
                                <img src={URL.createObjectURL(file)} alt="" />
                                <button onClick={() => setFiles(files.filter((_, j) => j !== i))}>×</button>
                            </div>
                        ))}
                    </div>
                )}

                {uploading && (
                    <div className="bento-upload-progress">
                        <div className="bento-upload-progress-bar" style={{ width: `${progress}%` }} />
                    </div>
                )}

                <button
                    className="bento-upload-submit"
                    disabled={files.length === 0 || uploading}
                    onClick={handleUpload}
                >
                    {uploading ? `Uploading ${progress}%` : `Upload ${files.length} photo${files.length !== 1 ? 's' : ''}`}
                </button>
            </div>
        </div>
    );
}
