'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface EngagementNudgeProps {
    type?: 'cv' | 'experience' | 'profile';
    userName?: string;
}

const STORAGE_KEY = 'mba_engagement_nudge';

const nudgeConfig = {
    cv: {
        title: '📄 Share Your Success Story',
        message: 'Your CV helped you land interviews! Help your batchmates by uploading it to the Golden CV Repository.',
        action: '/cv-repository/upload',
        actionText: 'Upload CV',
        minViews: 3,
        viewKey: 'cv_views',
    },
    experience: {
        title: '✍️ Share Your Interview Experience',
        message: "You've been learning from others - now it's your turn! Share your interview experience to help the cohort.",
        action: '/interviews/new',
        actionText: 'Share Experience',
        minViews: 3,
        viewKey: 'experience_views',
    },
    profile: {
        title: '👤 Complete Your Profile',
        message: 'A complete profile helps batchmates find and connect with you. Add your company, domain, and a bio.',
        action: '/settings',
        actionText: 'Complete Profile',
        minViews: 2,
        viewKey: 'profile_views',
    },
};

export function EngagementNudge({ type = 'experience', userName }: EngagementNudgeProps) {
    const [isVisible, setIsVisible] = useState(false);
    const config = nudgeConfig[type];

    useEffect(() => {
        checkShouldShow();
    }, []);

    const checkShouldShow = () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            const data = stored ? JSON.parse(stored) : {};

            // Check if dismissed for this type
            if (data[`${type}_dismissed`]) return;

            // Check if shown recently (within 7 days)
            const lastShown = data[`${type}_lastShown`];
            if (lastShown) {
                const daysSince = (Date.now() - new Date(lastShown).getTime()) / (1000 * 60 * 60 * 24);
                if (daysSince < 7) return;
            }

            // Increment view count for this type
            const viewKey = config.viewKey;
            data[viewKey] = (data[viewKey] || 0) + 1;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

            // Show after minimum views
            if (data[viewKey] >= config.minViews) {
                setTimeout(() => setIsVisible(true), 2000);
            }
        } catch (e) {
            console.warn('LocalStorage not available');
        }
    };

    const handleDismiss = (permanent = false) => {
        setIsVisible(false);
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            const data = stored ? JSON.parse(stored) : {};
            data[`${type}_lastShown`] = new Date().toISOString();
            if (permanent) {
                data[`${type}_dismissed`] = true;
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('LocalStorage not available');
        }
    };

    if (!isVisible) return null;

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 'var(--space-xl)',
                left: 'var(--space-xl)',
                zIndex: 999,
                animation: 'slideInLeft 0.5s ease-out',
            }}
        >
            <div
                style={{
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: 'var(--radius-xl)',
                    padding: 'var(--space-lg)',
                    boxShadow: '0 25px 50px -12px rgba(102, 126, 234, 0.4)',
                    maxWidth: '340px',
                    color: 'white',
                }}
            >
                {/* Close button */}
                <button
                    onClick={() => handleDismiss(false)}
                    style={{
                        position: 'absolute',
                        top: 'var(--space-sm)',
                        right: 'var(--space-sm)',
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        color: 'white',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    ✕
                </button>

                {/* Content */}
                <h4 style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    marginBottom: 'var(--space-sm)',
                    marginTop: 0
                }}>
                    {config.title}
                </h4>

                <p style={{
                    fontSize: '0.875rem',
                    opacity: 0.9,
                    marginBottom: 'var(--space-lg)',
                    lineHeight: 1.5,
                }}>
                    {config.message}
                </p>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                    <Link
                        href={config.action}
                        onClick={() => handleDismiss(true)}
                        style={{
                            padding: '0.5rem 1rem',
                            background: 'white',
                            color: 'var(--primary)',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            textDecoration: 'none',
                            transition: 'transform 0.2s ease',
                        }}
                    >
                        {config.actionText}
                    </Link>
                    <button
                        onClick={() => handleDismiss(false)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'rgba(255, 255, 255, 0.7)',
                            cursor: 'pointer',
                            fontSize: '0.8125rem',
                            padding: '0.5rem',
                        }}
                    >
                        Maybe later
                    </button>
                </div>

                {/* Don't show again link */}
                <button
                    onClick={() => handleDismiss(true)}
                    style={{
                        display: 'block',
                        marginTop: 'var(--space-md)',
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255, 255, 255, 0.5)',
                        cursor: 'pointer',
                        fontSize: '0.6875rem',
                        padding: 0,
                    }}
                >
                    Don't show this again
                </button>
            </div>

            <style jsx>{`
                @keyframes slideInLeft {
                    from {
                        transform: translateX(-100px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}

export default EngagementNudge;
