'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { DOMAINS } from '@/types';

// Icons
const ArrowLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5"></path>
        <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
);

const LoaderIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
    </svg>
);

export default function NewInterviewPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [aiProcessing, setAiProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        company: '',
        role: '',
        domain: '',
        content: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!formData.company.trim() || !formData.role.trim() || !formData.domain || !formData.content.trim()) {
            setError('Please fill in all fields');
            return;
        }

        if (formData.content.trim().length < 100) {
            setError('Please provide a more detailed experience (at least 100 characters)');
            return;
        }

        setLoading(true);
        setAiProcessing(true);

        try {
            const supabase = createClient();

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError('You must be logged in to submit an experience');
                setLoading(false);
                setAiProcessing(false);
                return;
            }

            // AI Refinement - Process content in background
            let refinedContent = formData.content.trim();
            let aiSummary = null;

            try {
                const aiResponse = await fetch('/api/ai/refine-experience', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content: formData.content.trim(),
                        company: formData.company.trim(),
                        role: formData.role.trim(),
                        domain: formData.domain,
                    }),
                });

                if (aiResponse.ok) {
                    const aiData = await aiResponse.json();
                    if (aiData.isRefined && aiData.refinedContent) {
                        refinedContent = aiData.refinedContent;
                        aiSummary = aiData.aiSummary;
                    }
                }
            } catch (aiError) {
                console.warn('AI refinement failed, using original content:', aiError);
                // Continue with original content if AI fails
            }

            setAiProcessing(false);

            const { error: insertError } = await supabase
                .from('interview_experiences')
                .insert({
                    user_id: user.id,
                    company: formData.company.trim(),
                    role: formData.role.trim(),
                    domain: formData.domain,
                    content: refinedContent,
                    upvotes: 0,
                    downvotes: 0,
                });

            if (insertError) throw insertError;

            router.push('/interviews');
            router.refresh();
        } catch (err) {
            console.error('Error submitting:', err);
            setError('Failed to submit experience. Please try again.');
        } finally {
            setLoading(false);
            setAiProcessing(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Back Link */}
            <Link
                href="/interviews"
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--space-lg)',
                    fontSize: '0.875rem'
                }}
            >
                <ArrowLeftIcon />
                Back to Experiences
            </Link>

            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-title">Share Interview Experience</h1>
                <p className="page-subtitle">Help your batchmates prepare by sharing your interview journey</p>
            </div>

            {/* Form Card */}
            <div className="card">
                <div className="card-body" style={{ padding: 'var(--space-xl)' }}>
                    {/* Error Message */}
                    {error && (
                        <div style={{
                            padding: 'var(--space-md)',
                            background: 'var(--error-light)',
                            color: '#991b1b',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--space-lg)',
                            fontSize: '0.875rem',
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Company */}
                        <div className="input-group">
                            <label className="label" htmlFor="company">Company Name *</label>
                            <input
                                type="text"
                                id="company"
                                name="company"
                                className="input"
                                placeholder="e.g., Google, McKinsey, Goldman Sachs"
                                value={formData.company}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        {/* Role */}
                        <div className="input-group">
                            <label className="label" htmlFor="role">Role / Position *</label>
                            <input
                                type="text"
                                id="role"
                                name="role"
                                className="input"
                                placeholder="e.g., Product Manager, Business Analyst, Associate"
                                value={formData.role}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        {/* Domain */}
                        <div className="input-group">
                            <label className="label" htmlFor="domain">Domain *</label>
                            <select
                                id="domain"
                                name="domain"
                                className="input select"
                                value={formData.domain}
                                onChange={handleChange}
                                disabled={loading}
                            >
                                <option value="">Select a domain</option>
                                {DOMAINS.map((domain) => (
                                    <option key={domain} value={domain}>{domain}</option>
                                ))}
                            </select>
                        </div>

                        {/* Experience Content */}
                        <div className="input-group">
                            <label className="label" htmlFor="content">Your Experience *</label>
                            <textarea
                                id="content"
                                name="content"
                                className="input textarea"
                                placeholder="Share details about your interview experience:
• Interview rounds (HR, Technical, Case Study, etc.)
• Types of questions asked
• Preparation tips
• Key learnings
• Timeline and process
                
Be as detailed as possible to help your batchmates!"
                                value={formData.content}
                                onChange={handleChange}
                                disabled={loading}
                                style={{ minHeight: '300px' }}
                            />
                            <p style={{
                                fontSize: '0.75rem',
                                color: formData.content.length < 100 ? 'var(--text-muted)' : 'var(--success)',
                                marginTop: '0.25rem'
                            }}>
                                {formData.content.length}/100 characters minimum
                            </p>
                        </div>

                        {/* AI Enhancement Info */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-sm)',
                            padding: 'var(--space-md)',
                            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                            borderRadius: 'var(--radius-lg)',
                            marginBottom: 'var(--space-lg)',
                            border: '1px solid rgba(102, 126, 234, 0.2)'
                        }}>
                            <span style={{ fontSize: '1.25rem' }}>✨</span>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                                <strong>AI-Enhanced:</strong> Your experience will be automatically formatted with clear headings and a summary section to help other members.
                            </p>
                        </div>

                        {/* Submit Buttons */}
                        <div style={{
                            display: 'flex',
                            gap: 'var(--space-md)',
                            justifyContent: 'flex-end',
                            marginTop: 'var(--space-md)'
                        }}>
                            <Link href="/interviews" className="btn btn-secondary">
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                                style={{ minWidth: '180px' }}
                            >
                                {loading ? (
                                    <>
                                        <LoaderIcon />
                                        {aiProcessing ? '✨ AI Processing...' : 'Saving...'}
                                    </>
                                ) : (
                                    <>
                                        ✨ Submit Experience
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Tips Card */}
            <div className="card" style={{ marginTop: 'var(--space-xl)' }}>
                <div className="card-body">
                    <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}>💡 Tips for a Great Experience Share</h3>
                    <ul style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        paddingLeft: 'var(--space-lg)',
                        lineHeight: 1.8
                    }}>
                        <li>Include the number of interview rounds and their format</li>
                        <li>Share specific types of questions (behavioral, technical, case studies)</li>
                        <li>Mention preparation resources that helped you</li>
                        <li>Include timeline from application to offer</li>
                        <li>Add any tips or gotchas for future candidates</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
