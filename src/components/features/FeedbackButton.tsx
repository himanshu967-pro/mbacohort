'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const SparkleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
        <path d="M5 3v4"></path>
        <path d="M19 17v4"></path>
        <path d="M3 5h4"></path>
        <path d="M17 19h4"></path>
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6 6 18"></path>
        <path d="m6 6 12 12"></path>
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

const FEEDBACK_QUESTIONS = [
    {
        id: 'missing_features',
        question: 'What features or functionality do you feel are missing from this portal?',
    },
    {
        id: 'frustrations',
        question: 'What frustrated you or didn\'t work as expected while using the portal?',
    },
    {
        id: 'improvements',
        question: 'If you could change one thing about this portal, what would it be?',
    },
    {
        id: 'useful',
        question: 'What\'s the most useful thing about this portal for you personally?',
    },
    {
        id: 'ideas',
        question: 'Any creative ideas or suggestions that could make this portal even better?',
    },
];

interface FeedbackFormProps {
    onClose: () => void;
}

function FeedbackForm({ onClose }: FeedbackFormProps) {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            // Format feedback as structured message
            const feedbackMessage = FEEDBACK_QUESTIONS
                .map(q => `**${q.question}**\n${answers[q.id] || 'Not answered'}`)
                .join('\n\n---\n\n');

            await supabase.from('feedback').insert({
                user_id: user?.id,
                message: feedbackMessage,
                category: 'general'
            });

            setSubmitted(true);
        } catch (error) {
            console.error('Error submitting feedback:', error);
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="modal-backdrop" onClick={onClose}>
                <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', textAlign: 'center' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto var(--space-lg)',
                        color: 'white'
                    }}>
                        <CheckIcon />
                    </div>
                    <h2 style={{ marginBottom: 'var(--space-md)' }}>Thank You! 🙏</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
                        Your feedback is invaluable and will help us build a better portal for everyone.
                    </p>
                    <button className="btn btn-primary" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '85vh', overflow: 'auto' }}>
                <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                    <div>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', margin: 0 }}>
                            <span style={{ fontSize: '1.5rem' }}>💬</span> We Want Your Feedback!
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-xs)', fontSize: '0.875rem' }}>
                            Help us make this portal better for everyone
                        </p>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '0.5rem' }}>
                        <CloseIcon />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ paddingTop: 'var(--space-lg)' }}>
                        {FEEDBACK_QUESTIONS.map((q, index) => (
                            <div key={q.id} className="input-group" style={{ marginBottom: 'var(--space-lg)' }}>
                                <label className="label" style={{ fontWeight: 500 }}>
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: 'var(--gradient-primary)',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        marginRight: 'var(--space-sm)'
                                    }}>
                                        {index + 1}
                                    </span>
                                    {q.question}
                                </label>
                                <textarea
                                    className="input"
                                    rows={3}
                                    value={answers[q.id] || ''}
                                    onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                    style={{ resize: 'vertical', minHeight: '80px' }}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || Object.values(answers).every(v => !v.trim())}
                        >
                            {loading ? 'Submitting...' : 'Submit Feedback'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function FeedbackButton() {
    const [showForm, setShowForm] = useState(false);

    return (
        <>
            <button
                onClick={() => setShowForm(true)}
                className="feedback-button"
                style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '14px 24px',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4), 0 0 40px rgba(102, 126, 234, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    zIndex: 1000,
                    animation: 'pulse-glow 2s ease-in-out infinite',
                    transition: 'all 0.3s ease',
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 6px 30px rgba(102, 126, 234, 0.5), 0 0 60px rgba(102, 126, 234, 0.3)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.4), 0 0 40px rgba(102, 126, 234, 0.2)';
                }}
            >
                <SparkleIcon />
                Share Feedback
            </button>

            <style jsx global>{`
                @keyframes pulse-glow {
                    0%, 100% {
                        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4), 0 0 40px rgba(102, 126, 234, 0.2);
                    }
                    50% {
                        box-shadow: 0 4px 30px rgba(102, 126, 234, 0.6), 0 0 60px rgba(102, 126, 234, 0.4);
                    }
                }
            `}</style>

            {showForm && <FeedbackForm onClose={() => setShowForm(false)} />}
        </>
    );
}
