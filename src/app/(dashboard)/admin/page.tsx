import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

// Icons
const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
);

const MessageSquareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
);

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" x2="12" y1="3" y2="15"></line>
    </svg>
);

const ArrowRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14"></path>
        <path d="m12 5 7 7-7 7"></path>
    </svg>
);

const ShieldIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path>
    </svg>
);

export default async function AdminPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Check if user is admin
    const { data: profile } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    if (!profile?.is_admin) {
        redirect('/dashboard');
    }

    // Get stats
    const [usersResult, feedbackResult, experiencesResult, resumesResult] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('feedback').select('id', { count: 'exact', head: true }),
        supabase.from('interview_experiences').select('id', { count: 'exact', head: true }),
        supabase.from('resumes').select('id', { count: 'exact', head: true }),
    ]);

    const stats = {
        users: usersResult.count || 0,
        feedback: feedbackResult.count || 0,
        experiences: experiencesResult.count || 0,
        resumes: resumesResult.count || 0,
    };

    return (
        <div>
            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-title">Admin Panel</h1>
                <p className="page-subtitle">Manage users, content, and platform settings</p>
            </div>

            {/* Admin Stats */}
            <div className="stats-grid" style={{ marginBottom: 'var(--space-2xl)' }}>
                <div className="stat-card">
                    <div className="stat-icon primary">
                        <UsersIcon />
                    </div>
                    <div className="stat-value">{stats.users}</div>
                    <div className="stat-label">Total Users</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon accent">
                        <MessageSquareIcon />
                    </div>
                    <div className="stat-value">{stats.feedback}</div>
                    <div className="stat-label">Feedback Received</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon warning">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="20" height="14" x="2" y="7" rx="2" ry="2"></rect>
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                        </svg>
                    </div>
                    <div className="stat-value">{stats.experiences}</div>
                    <div className="stat-label">Interviews Shared</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon success">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                    </div>
                    <div className="stat-value">{stats.resumes}</div>
                    <div className="stat-label">CVs Uploaded</div>
                </div>
            </div>

            {/* Admin Actions */}
            <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>Quick Actions</h2>
            <div style={{
                display: 'grid',
                gap: 'var(--space-lg)',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'
            }}>
                {/* User Management */}
                <Link href="/admin/users" className="card" style={{ textDecoration: 'none' }}>
                    <div className="card-body">
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-md)',
                            marginBottom: 'var(--space-md)'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: 'var(--radius-lg)',
                                background: 'var(--primary-100)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--primary-600)',
                            }}>
                                <UsersIcon />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    User Management
                                </h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    View and manage cohort members
                                </p>
                            </div>
                            <ArrowRightIcon />
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            View all users, grant admin access, or deactivate accounts
                        </p>
                    </div>
                </Link>

                {/* View Feedback */}
                <Link href="/admin/feedback" className="card" style={{ textDecoration: 'none' }}>
                    <div className="card-body">
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-md)',
                            marginBottom: 'var(--space-md)'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: 'var(--radius-lg)',
                                background: 'var(--accent-100)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--accent-600)',
                            }}>
                                <MessageSquareIcon />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    User Feedback
                                </h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    Review submitted feedback
                                </p>
                            </div>
                            <ArrowRightIcon />
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            View bug reports, feature requests, and general feedback
                        </p>
                    </div>
                </Link>

                {/* Bulk Import */}
                <Link href="/admin/import" className="card" style={{ textDecoration: 'none' }}>
                    <div className="card-body">
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-md)',
                            marginBottom: 'var(--space-md)'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: 'var(--radius-lg)',
                                background: 'var(--warning-light)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--warning)',
                            }}>
                                <UploadIcon />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    Bulk Data Import
                                </h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    Import users via CSV
                                </p>
                            </div>
                            <ArrowRightIcon />
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            Add multiple users or data entries using CSV files
                        </p>
                    </div>
                </Link>
            </div>

            {/* Access Notice */}
            <div className="card" style={{
                marginTop: 'var(--space-2xl)',
                background: 'var(--primary-50)',
                border: '1px solid var(--primary-200)'
            }}>
                <div className="card-body" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-lg)'
                }}>
                    <div style={{ color: 'var(--primary-600)' }}>
                        <ShieldIcon />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-xs)' }}>
                            Admin Access Notice
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            You have administrative privileges. All actions are logged. Please use these
                            powers responsibly and contact the platform owner if you notice any issues.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
