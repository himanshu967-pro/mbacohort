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
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
    </svg>
);

const CheckCircle = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);

export default function SignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const validatePassword = (password: string) => {
        if (password.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
        if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
        if (!/[0-9]/.test(password)) return 'Password must contain a number';
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Validate password strength
        const passwordError = validatePassword(formData.password);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        setLoading(true);

        try {
            const supabase = createClient();

            // Sign up the user
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        name: formData.name,
                    },
                },
            });

            if (signUpError) {
                setError(signUpError.message);
                return;
            }

            if (data.user) {
                // Create user profile in the users table
                const { error: profileError } = await supabase
                    .from('users')
                    .insert({
                        id: data.user.id,
                        email: formData.email,
                        name: formData.name,
                        is_admin: false,
                    });

                if (profileError) {
                    console.error('Profile creation error:', profileError);
                    // Don't block signup if profile creation fails
                }
            }

            setSuccess(true);

            // Redirect after a short delay
            setTimeout(() => {
                router.push('/login');
            }, 3000);

        } catch {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--background)',
                padding: 'var(--space-lg)',
            }}>
                <div className="card animate-fadeIn" style={{
                    width: '100%',
                    maxWidth: '420px',
                    textAlign: 'center',
                }}>
                    <div className="card-body" style={{ padding: 'var(--space-2xl)' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            margin: '0 auto var(--space-lg)',
                            borderRadius: '50%',
                            background: 'var(--success-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--success)',
                        }}>
                            <CheckCircle />
                        </div>
                        <h2 style={{ marginBottom: 'var(--space-md)' }}>Account Created!</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
                            Please check your email to verify your account. You will be redirected to the login page shortly.
                        </p>
                        <Link href="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                            Go to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

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

            {/* Signup Card */}
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
                        <h1 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-xs)' }}>Create Account</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            Join the MBA Cohort Portal
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

                    {/* Signup Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label className="label" htmlFor="name">Full Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                className="input"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="input-group">
                            <label className="label" htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className="input"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
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
                                    name="password"
                                    className="input"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
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
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                Min 8 characters with uppercase, lowercase, and number
                            </p>
                        </div>

                        <div className="input-group">
                            <label className="label" htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                name="confirmPassword"
                                className="input"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{
                                width: '100%',
                                justifyContent: 'center',
                                marginTop: 'var(--space-md)',
                            }}
                        >
                            {loading ? (
                                <>
                                    <LoaderIcon />
                                    Creating Account...
                                </>
                            ) : (
                                'Create Account'
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
                        Already have an account?{' '}
                        <Link href="/login" style={{ color: 'var(--primary-600)', fontWeight: 500 }}>
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
