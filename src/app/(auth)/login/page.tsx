'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Icons
const GraduationCap = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
        <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
    </svg>
);

const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
        <line x1="2" x2="22" y1="2" y2="22"></line>
    </svg>
);

const LoaderIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
    </svg>
);

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError(error.message);
                return;
            }

            // Redirect to dashboard on success
            router.push('/dashboard');
            router.refresh();
        } catch {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--background)',
            padding: 'var(--space-lg)',
        }}>
            {/* Background Pattern */}
            <div style={{
                position: 'fixed',
                inset: 0,
                background: 'var(--gradient-hero)',
                opacity: 0.05,
                pointerEvents: 'none',
            }} />

            {/* Login Card */}
            <div className="card animate-fadeIn" style={{
                width: '100%',
                maxWidth: '420px',
                position: 'relative',
            }}>
                <div className="card-body" style={{ padding: 'var(--space-2xl)' }}>
                    {/* Logo & Title */}
                    <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            margin: '0 auto var(--space-lg)',
                            borderRadius: 'var(--radius-xl)',
                            background: 'var(--gradient-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                        }}>
                            <GraduationCap />
                        </div>
                        <h1 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-xs)' }}>Welcome Back</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            Sign in to MBA Cohort Portal
                        </p>
                    </div>

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

                    {/* Login Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label className="label" htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                className="input"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="input-group">
                            <label className="label" htmlFor="password">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    className="input"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    style={{ paddingRight: '2.75rem' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '0.75rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--text-muted)',
                                        padding: '0.25rem',
                                    }}
                                >
                                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            marginBottom: 'var(--space-lg)',
                        }}>
                            <Link
                                href="/forgot-password"
                                style={{
                                    fontSize: '0.875rem',
                                    color: 'var(--primary-600)',
                                }}
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{
                                width: '100%',
                                justifyContent: 'center',
                            }}
                        >
                            {loading ? (
                                <>
                                    <LoaderIcon />
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <p style={{
                        textAlign: 'center',
                        marginTop: 'var(--space-xl)',
                        fontSize: '0.875rem',
                        color: 'var(--text-muted)',
                    }}>
                        Need an account?{' '}
                        <Link href="/signup" style={{ color: 'var(--primary-600)', fontWeight: 500 }}>
                            Contact Admin
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
