'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

// Common interview types
const INTERVIEW_TYPES = [
    { value: 'behavioral', label: 'Behavioral', icon: '💬' },
    { value: 'case', label: 'Case Study', icon: '📊' },
    { value: 'technical', label: 'Technical', icon: '💻' },
    { value: 'situational', label: 'Situational', icon: '🎯' },
    { value: 'leadership', label: 'Leadership', icon: '👑' },
];

// Popular companies for quick selection
const POPULAR_COMPANIES = [
    'McKinsey', 'BCG', 'Bain', 'Deloitte', 'Amazon',
    'Google', 'Microsoft', 'Goldman Sachs', 'JP Morgan'
];

// Icons
const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
    </svg>
);

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m22 2-7 20-4-9-9-4Z"></path>
        <path d="M22 2 11 13"></path>
    </svg>
);

const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
        <path d="M21 3v5h-5"></path>
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
        <path d="M3 21v-5h5"></path>
    </svg>
);

const LightbulbIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path>
        <path d="M9 18h6"></path>
        <path d="M10 22h4"></path>
    </svg>
);

export default function InterviewPrepPage() {
    const [company, setCompany] = useState('');
    const [role, setRole] = useState('');
    const [interviewType, setInterviewType] = useState('behavioral');
    const [isStarted, setIsStarted] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Auto-resize textarea
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
        }
    }, [input]);

    const startInterview = async () => {
        if (!company.trim()) {
            alert('Please enter a company name');
            return;
        }

        setIsStarted(true);
        setIsLoading(true);

        try {
            const response = await fetch('/api/ai/interview-prep', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: 'Please start the mock interview.',
                    company,
                    role,
                    interviewType,
                    conversationHistory: [],
                    mode: 'interview'
                })
            });

            const data = await response.json();

            if (data.error) {
                setMessages([{ role: 'assistant', content: `Error: ${data.error}` }]);
            } else {
                setMessages([{ role: 'assistant', content: data.response }]);
            }
        } catch {
            setMessages([{
                role: 'assistant',
                content: 'Sorry, something went wrong. Please try again.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await fetch('/api/ai/interview-prep', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    company,
                    role,
                    interviewType,
                    conversationHistory: messages,
                    mode: 'interview'
                })
            });

            const data = await response.json();

            if (data.error) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `Error: ${data.error}`
                }]);
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: data.response
                }]);
            }
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, something went wrong. Please try again.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const getFeedback = async (answerIndex: number) => {
        const answer = messages[answerIndex];
        if (answer.role !== 'user') return;

        setIsLoading(true);

        try {
            const response = await fetch('/api/ai/interview-prep', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: answer.content,
                    company,
                    role,
                    interviewType,
                    conversationHistory: messages.slice(0, answerIndex + 1),
                    mode: 'feedback'
                })
            });

            const data = await response.json();

            if (!data.error) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `📝 **Feedback on your answer:**\n\n${data.response}`
                }]);
            }
        } catch {
            // Silent fail for feedback
        } finally {
            setIsLoading(false);
        }
    };

    const resetInterview = () => {
        setIsStarted(false);
        setMessages([]);
        setInput('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div>
            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <SparklesIcon />
                    Interview Prep Assistant
                </h1>
                <p className="page-subtitle">Practice mock interviews with AI and get instant feedback</p>
            </div>

            {!isStarted ? (
                /* Setup Form */
                <div className="card" style={{ maxWidth: '600px' }}>
                    <div className="card-body" style={{ padding: 'var(--space-xl)' }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>
                            Set Up Your Mock Interview
                        </h2>

                        {/* Company Input */}
                        <div className="input-group">
                            <label className="label">Target Company *</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="e.g., McKinsey, Amazon, Goldman Sachs"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                            />
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '0.5rem',
                                marginTop: '0.75rem'
                            }}>
                                {POPULAR_COMPANIES.map((c) => (
                                    <button
                                        key={c}
                                        className={`chip ${company === c ? 'chip-active' : ''}`}
                                        onClick={() => setCompany(c)}
                                        type="button"
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Role Input */}
                        <div className="input-group">
                            <label className="label">Role (Optional)</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="e.g., Associate, Product Manager, Analyst"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                            />
                        </div>

                        {/* Interview Type */}
                        <div className="input-group">
                            <label className="label">Interview Type</label>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                gap: '0.75rem'
                            }}>
                                {INTERVIEW_TYPES.map((type) => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        className={`chip ${interviewType === type.value ? 'chip-active' : ''}`}
                                        onClick={() => setInterviewType(type.value)}
                                        style={{
                                            padding: '0.75rem 1rem',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <span>{type.icon}</span>
                                        <span>{type.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Start Button */}
                        <button
                            className="btn btn-primary btn-lg"
                            style={{ width: '100%', marginTop: 'var(--space-lg)' }}
                            onClick={startInterview}
                        >
                            <SparklesIcon />
                            Start Mock Interview
                        </button>

                        {/* Tips */}
                        <div style={{
                            marginTop: 'var(--space-xl)',
                            padding: 'var(--space-md)',
                            background: 'var(--primary-50)',
                            borderRadius: 'var(--radius-lg)',
                            display: 'flex',
                            gap: '0.75rem'
                        }}>
                            <LightbulbIcon />
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                <strong>Tips:</strong> Treat this like a real interview. Use the STAR method for behavioral questions.
                                After each answer, you can ask for feedback to improve!
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Interview Chat */
                <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)' }}>
                    {/* Interview Info Bar */}
                    <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
                        <div className="card-body" style={{
                            padding: 'var(--space-md) var(--space-lg)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                                <span className="badge badge-primary">{company}</span>
                                {role && <span className="badge badge-accent">{role}</span>}
                                <span className="badge" style={{ background: 'var(--gray-100)' }}>
                                    {INTERVIEW_TYPES.find(t => t.value === interviewType)?.icon}{' '}
                                    {INTERVIEW_TYPES.find(t => t.value === interviewType)?.label}
                                </span>
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={resetInterview}>
                                <RefreshIcon />
                                New Interview
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: 'var(--space-lg)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--space-md)'
                        }}>
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        maxWidth: '85%',
                                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: '1rem 1.25rem',
                                            borderRadius: 'var(--radius-lg)',
                                            background: msg.role === 'user'
                                                ? 'var(--gradient-primary)'
                                                : 'var(--gray-100)',
                                            color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                                            fontSize: '0.9375rem',
                                            lineHeight: 1.6,
                                            whiteSpace: 'pre-wrap'
                                        }}
                                    >
                                        {msg.content}
                                    </div>

                                    {/* Feedback button for user messages */}
                                    {msg.role === 'user' && idx > 0 && (
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}
                                            onClick={() => getFeedback(idx)}
                                            disabled={isLoading}
                                        >
                                            <LightbulbIcon />
                                            Get Feedback
                                        </button>
                                    )}
                                </div>
                            ))}

                            {isLoading && (
                                <div style={{ alignSelf: 'flex-start' }}>
                                    <div style={{
                                        padding: '1rem 1.25rem',
                                        borderRadius: 'var(--radius-lg)',
                                        background: 'var(--gray-100)',
                                        display: 'flex',
                                        gap: '4px'
                                    }}>
                                        <span className="ai-chat-typing">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div style={{
                            padding: 'var(--space-md) var(--space-lg)',
                            borderTop: '1px solid var(--border-light)',
                            background: 'var(--gray-50)',
                            display: 'flex',
                            gap: 'var(--space-sm)'
                        }}>
                            <textarea
                                ref={inputRef}
                                className="input"
                                placeholder="Type your answer... (Shift+Enter for new line)"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                disabled={isLoading}
                                style={{
                                    flex: 1,
                                    resize: 'none',
                                    minHeight: '48px',
                                    maxHeight: '150px'
                                }}
                                rows={1}
                            />
                            <button
                                className="btn btn-primary"
                                onClick={sendMessage}
                                disabled={!input.trim() || isLoading}
                                style={{ alignSelf: 'flex-end' }}
                            >
                                <SendIcon />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
