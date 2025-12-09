'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

// Icons
const ChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6 6 18"></path>
        <path d="m6 6 12 12"></path>
    </svg>
);

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m22 2-7 20-4-9-9-4Z"></path>
        <path d="M22 2 11 13"></path>
    </svg>
);

const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
    </svg>
);

export default function AIChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    conversationHistory: messages
                })
            });

            const data = await response.json();

            if (data.error) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `Sorry, I encountered an error: ${data.error}`
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

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="ai-chat-button"
                aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
            >
                {isOpen ? <CloseIcon /> : <ChatIcon />}
            </button>

            {/* Chat Panel */}
            {isOpen && (
                <div className="ai-chat-panel">
                    {/* Header */}
                    <div className="ai-chat-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <SparklesIcon />
                            <span style={{ fontWeight: 600 }}>AI Assistant</span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '0.25rem' }}
                        >
                            <CloseIcon />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="ai-chat-messages">
                        {messages.length === 0 && (
                            <div className="ai-chat-welcome">
                                <SparklesIcon />
                                <h4>Hi! I&apos;m your AI Assistant</h4>
                                <p>Ask me about interview experiences, resources, events, or anything about your MBA cohort!</p>
                                <div className="ai-chat-suggestions">
                                    <button onClick={() => setInput('What interview tips are available for consulting?')}>
                                        💼 Consulting interview tips
                                    </button>
                                    <button onClick={() => setInput('What resources are available for case prep?')}>
                                        📚 Case prep resources
                                    </button>
                                    <button onClick={() => setInput('What are the recent announcements?')}>
                                        📣 Recent announcements
                                    </button>
                                </div>
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`ai-chat-message ${msg.role === 'user' ? 'user' : 'assistant'}`}
                            >
                                {msg.content}
                            </div>
                        ))}

                        {isLoading && (
                            <div className="ai-chat-message assistant">
                                <div className="ai-chat-typing">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="ai-chat-input-container">
                        <input
                            ref={inputRef}
                            type="text"
                            className="ai-chat-input"
                            placeholder="Ask anything..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            disabled={isLoading}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim() || isLoading}
                            className="ai-chat-send"
                        >
                            <SendIcon />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
