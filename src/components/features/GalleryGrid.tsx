'use client';

import { useState, useRef, useEffect } from 'react';

interface GalleryImage {
    id: string;
    album_name: string;
    image_url: string;
    thumbnail_url: string;
    caption: string;
    width: number;
    height: number;
    uploaded_by: string;
    uploader_name: string;
    created_at: string;
}

interface GalleryGridProps {
    images: GalleryImage[];
    onImageClick: (image: GalleryImage, index: number) => void;
}

export default function GalleryGrid({ images, onImageClick }: GalleryGridProps) {
    const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
    const [visibleImages, setVisibleImages] = useState<Set<string>>(new Set());
    const observerRef = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const id = entry.target.getAttribute('data-id');
                        if (id) {
                            setVisibleImages((prev) => new Set([...prev, id]));
                        }
                    }
                });
            },
            { rootMargin: '100px', threshold: 0.1 }
        );

        return () => observerRef.current?.disconnect();
    }, []);

    const handleImageLoad = (id: string) => {
        setLoadedImages((prev) => new Set([...prev, id]));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="gallery-masonry">
            {images.map((image, index) => {
                const aspectRatio = image.width && image.height
                    ? image.height / image.width
                    : 1;
                const isLoaded = loadedImages.has(image.id);
                const isVisible = visibleImages.has(image.id);

                return (
                    <div
                        key={image.id}
                        data-id={image.id}
                        className={`gallery-item ${isLoaded ? 'loaded' : ''}`}
                        style={{
                            '--aspect-ratio': aspectRatio,
                            animationDelay: `${index * 0.05}s`
                        } as React.CSSProperties}
                        onClick={() => onImageClick(image, index)}
                        ref={(el) => {
                            if (el && observerRef.current) {
                                observerRef.current.observe(el);
                            }
                        }}
                    >
                        {/* Blur placeholder */}
                        <div className="gallery-item-placeholder" />

                        {/* Actual image */}
                        {isVisible && (
                            <img
                                src={image.thumbnail_url || image.image_url}
                                alt={image.caption || 'Gallery image'}
                                onLoad={() => handleImageLoad(image.id)}
                                loading="lazy"
                            />
                        )}

                        {/* Overlay */}
                        <div className="gallery-item-overlay">
                            <div className="gallery-item-info">
                                {image.caption && (
                                    <p className="gallery-item-caption">{image.caption}</p>
                                )}
                                <div className="gallery-item-meta">
                                    <span className="gallery-item-album">{image.album_name}</span>
                                    <span className="gallery-item-date">{formatDate(image.created_at)}</span>
                                </div>
                                {image.uploader_name && (
                                    <span className="gallery-item-uploader">
                                        by {image.uploader_name}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
