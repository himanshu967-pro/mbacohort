'use client';

import { useEffect, useCallback } from 'react';

interface GalleryImage {
    id: string;
    album_name: string;
    image_url: string;
    caption: string;
    uploader_name: string;
    created_at: string;
}

interface GalleryLightboxProps {
    image: GalleryImage;
    onClose: () => void;
    onPrev: () => void;
    onNext: () => void;
    currentIndex: number;
    totalImages: number;
}

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const ChevronLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
);

const ChevronRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
);

export default function GalleryLightbox({
    image,
    onClose,
    onPrev,
    onNext,
    currentIndex,
    totalImages
}: GalleryLightboxProps) {
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        switch (e.key) {
            case 'Escape':
                onClose();
                break;
            case 'ArrowLeft':
                onPrev();
                break;
            case 'ArrowRight':
                onNext();
                break;
        }
    }, [onClose, onPrev, onNext]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [handleKeyDown]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="lightbox-overlay" onClick={onClose}>
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                {/* Close button */}
                <button className="lightbox-close" onClick={onClose} aria-label="Close">
                    <CloseIcon />
                </button>

                {/* Navigation arrows */}
                {totalImages > 1 && (
                    <>
                        <button
                            className="lightbox-nav lightbox-prev"
                            onClick={onPrev}
                            aria-label="Previous image"
                        >
                            <ChevronLeftIcon />
                        </button>
                        <button
                            className="lightbox-nav lightbox-next"
                            onClick={onNext}
                            aria-label="Next image"
                        >
                            <ChevronRightIcon />
                        </button>
                    </>
                )}

                {/* Image */}
                <div className="lightbox-image-container">
                    <img
                        src={image.image_url}
                        alt={image.caption || 'Gallery image'}
                        className="lightbox-image"
                    />
                </div>

                {/* Image info */}
                <div className="lightbox-info">
                    <div className="lightbox-info-main">
                        {image.caption && (
                            <p className="lightbox-caption">{image.caption}</p>
                        )}
                        <div className="lightbox-meta">
                            <span className="lightbox-album">{image.album_name}</span>
                            <span className="lightbox-separator">•</span>
                            <span className="lightbox-date">{formatDate(image.created_at)}</span>
                            {image.uploader_name && (
                                <>
                                    <span className="lightbox-separator">•</span>
                                    <span className="lightbox-uploader">by {image.uploader_name}</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="lightbox-counter">
                        {currentIndex + 1} / {totalImages}
                    </div>
                </div>
            </div>
        </div>
    );
}
