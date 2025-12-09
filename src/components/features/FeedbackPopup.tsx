'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface FeedbackPopupProps {
    userId?: string;
}

const STORAGE_KEY = 'mba_feedback_popup';
const DAYS_BETWEEN_POPUPS = 30;
const MIN_PAGE_VISITS = 5;

export function FeedbackPopup({ userId }: FeedbackPopupProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [rating, setRating] = useState<number | null>(null);
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        checkShouldShow();
    }, []);

    const checkShouldShow = () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            const data = stored ? JSON.parse(stored) : { visits: 0, lastShown: null, dismissed: false };

            // Increment visit count
            data.visits = (data.visits || 0) + 1;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

            // Don't show if permanently dismissed
            if (data.dismissed) return;

            // Don't show if shown recently
            if (data.lastShown) {
                const lastShownDate = new Date(data.lastShown);
                const daysSinceLastShown = (Date.now() - lastShownDate.getTime()) / (1000 * 60 * 60 * 24);
                if (daysSinceLastShown < DAYS_BETWEEN_POPUPS) return;
            }

            // Show after minimum visits
            if (data.visits >= MIN_PAGE_VISITS) {
                // Delay showing to not be annoying
                setTimeout(() => setIsVisible(true), 3000);
            }
        } catch (e) {
            console.warn('LocalStorage not available');
        }
    };

    const markAsShown = () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            const data = stored ? JSON.parse(stored) : { visits: 0 };
            data.lastShown = new Date().toISOString();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('LocalStorage not available');
        }
    };

    const handleDismiss = (permanent = false) => {
        setIsVisible(false);
        markAsShown();
        if (permanent) {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                const data = stored ? JSON.parse(stored) : {};
                data.dismissed = true;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            } catch (e) {
                console.warn('LocalStorage not available');
            }
        }
    };

    const handleSubmit = async () => {
        if (!rating) return;

        setIsSubmitting(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            await supabase.from('feedback').insert({
                user_id: user?.id,
                category: 'platform_rating',
                message: `Rating: ${rating}/5${feedback ? ` - ${feedback}` : ''}`,
            });

            setIsSubmitted(true);
            markAsShown();
            setTimeout(() => setIsVisible(false), 2000);
        } catch (error) {
            console.error('Error submitting feedback:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isVisible) return null;

    const ratings = ['😞', '😕', '😐', '🙂', '😍'];

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 'var(--space-xl)',
                right: 'var(--space-xl)',
                zIndex: 1000,
                animation: 'slideInUp 0.4s ease-out',
            }}
        >
            <div
                style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: 'var(--radius-xl)',
                    padding: 'var(--space-xl)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.8)',
                    maxWidth: '320px',
                    width: '100%',
                }}
            >
                {isSubmitted ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-md)' }}>
                        <span style={{ fontSize: '2.5rem' }}>🎉</span>
                        <p style={{ marginTop: 'var(--space-md)', fontWeight: 500 }}>
                            Thank you for your feedback!
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                                How's your experience?
                            </h4>
                            <button
                                onClick={() => handleDismiss(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '0.25rem',
                                    color: 'var(--text-muted)',
                                    fontSize: '1.25rem',
                                    lineHeight: 1,
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Rating Selector */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: 'var(--space-lg)',
                        }}>
                            {ratings.map((emoji, index) => (
                                <button
                                    key={index}
                                    onClick={() => setRating(index + 1)}
                                    style={{
                                        background: rating === index + 1 ? 'var(--primary-light)' : 'transparent',
                                        border: rating === index + 1 ? '2px solid var(--primary)' : '2px solid transparent',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '0.75rem',
                                        fontSize: '1.75rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        transform: rating === index + 1 ? 'scale(1.1)' : 'scale(1)',
                                    }}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>

                        {/* Optional feedback text */}
                        {rating && (
                            <textarea
                                placeholder="Any suggestions? (optional)"
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: 'var(--space-md)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-md)',
                                    resize: 'none',
                                    height: '80px',
                                    marginBottom: 'var(--space-md)',
                                    fontSize: '0.875rem',
                                    fontFamily: 'inherit',
                                }}
                            />
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                            <button
                                onClick={() => handleDismiss(true)}
                                style={{
                                    flex: 1,
                                    padding: 'var(--space-sm)',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    color: 'var(--text-muted)',
                                }}
                            >
                                Don't show again
                            </button>
                            {rating && (
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="btn btn-primary btn-sm"
                                    style={{ flex: 1 }}
                                >
                                    {isSubmitting ? 'Sending...' : 'Send Feedback'}
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>

            <style jsx>{`
                @keyframes slideInUp {
                    from {
                        transform: translateY(100px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}

export default FeedbackPopup;
