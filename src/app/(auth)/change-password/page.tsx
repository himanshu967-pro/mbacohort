'use client';

import { useState } from 'react';
import Link from 'next/link';
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
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);

const ArrowLeft = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5"></path>
        <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
);

export default function ChangePasswordPage() {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
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

        // Validate new passwords match
        if (formData.newPassword !== formData.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        // Validate password strength
        const passwordError = validatePassword(formData.newPassword);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        setLoading(true);

        try {
            const supabase = createClient();

            const { error: updateError } = await supabase.auth.updateUser({
                password: formData.newPassword,
            });

            if (updateError) {
                setError(updateError.message);
                return;
            }

            setSuccess(true);
            setFormData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });

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
                            width: '80px',
                            height: '80px',
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
                        <h2 style={{ marginBottom: 'var(--space-md)' }}>Password Updated!</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
                            Your password has been changed successfully.
                        </p>
                        <Link href="/dashboard" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                            Back to Dashboard
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

            {/* Change Password Card */}
            <div className="card animate-fadeIn" style={{
                width: '100%',
                maxWidth: '420px',
                position: 'relative',
            }}>
                <div className="card-body" style={{ padding: 'var(--space-2xl)' }}>
                    {/* Back Link */}
                    <Link href="/settings" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                        marginBottom: 'var(--space-lg)',
                    }}>
                        <ArrowLeft />
                        Back to Settings
                    </Link>

                    {/* Title */}
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
                        <h1 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-xs)' }}>Change Password</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            Update your account password
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

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label className="label" htmlFor="currentPassword">Current Password</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="currentPassword"
                                name="currentPassword"
                                className="input"
                                placeholder="••••••••"
                                value={formData.currentPassword}
                                onChange={handleChange}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="input-group">
                            <label className="label" htmlFor="newPassword">New Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="newPassword"
                                    name="newPassword"
                                    className="input"
                                    placeholder="••••••••"
                                    value={formData.newPassword}
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
                            <label className="label" htmlFor="confirmPassword">Confirm New Password</label>
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
                                    Updating Password...
                                </>
                            ) : (
                                'Update Password'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
