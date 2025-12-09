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

const BriefcaseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="7" rx="2" ry="2"></rect>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
    </svg>
);

const FileTextIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" x2="8" y1="13" y2="13"></line>
        <line x1="16" x2="8" y1="17" y2="17"></line>
    </svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
        <line x1="16" x2="16" y1="2" y2="6"></line>
        <line x1="8" x2="8" y1="2" y2="6"></line>
        <line x1="3" x2="21" y1="10" y2="10"></line>
    </svg>
);

const ArrowRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14"></path>
        <path d="m12 5 7 7-7 7"></path>
    </svg>
);

const BellIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14"></path>
        <path d="M5 12h14"></path>
    </svg>
);

export default async function DashboardPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get user profile
    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

    const fullName = profile?.name || user.email?.split('@')[0] || 'User';
    const firstName = fullName.split(' ')[0]; // Get first name only
    const isAdmin = profile?.is_admin || false;

    return (
        <div>
            {/* Welcome Section */}
            <div style={{ marginBottom: 'var(--space-xl)' }}>
                <h1 style={{ fontSize: '1.75rem', marginBottom: 'var(--space-xs)' }}>
                    Welcome, {firstName}! 👋
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Welcome back to the MBA Cohort Portal
                </p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid" style={{ marginBottom: 'var(--space-2xl)' }}>
                <div className="stat-card">
                    <div className="stat-icon primary">
                        <UsersIcon />
                    </div>
                    <div className="stat-value">67</div>
                    <div className="stat-label">Cohort Members</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon accent">
                        <BriefcaseIcon />
                    </div>
                    <div className="stat-value">0</div>
                    <div className="stat-label">Interview Experiences</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon warning">
                        <FileTextIcon />
                    </div>
                    <div className="stat-value">0</div>
                    <div className="stat-label">CVs Shared</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon success">
                        <CalendarIcon />
                    </div>
                    <div className="stat-value">0</div>
                    <div className="stat-label">Upcoming Events</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div style={{ marginBottom: 'var(--space-2xl)' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>Quick Actions</h2>
                <div style={{
                    display: 'grid',
                    gap: '1rem',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'
                }}>
                    <Link href="/interviews/new" className="card" style={{ textDecoration: 'none' }}>
                        <div className="card-body" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-md)',
                            padding: 'var(--space-lg)'
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
                                <PlusIcon />
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Share Interview Experience</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Help your batchmates</div>
                            </div>
                        </div>
                    </Link>

                    <Link href="/cv-repository/upload" className="card" style={{ textDecoration: 'none' }}>
                        <div className="card-body" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-md)',
                            padding: 'var(--space-lg)'
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
                                <FileTextIcon />
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Upload Your CV</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Add to Golden CV repo</div>
                            </div>
                        </div>
                    </Link>

                    <Link href="/members" className="card" style={{ textDecoration: 'none' }}>
                        <div className="card-body" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-md)',
                            padding: 'var(--space-lg)'
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
                                <UsersIcon />
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Browse Members</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Connect with batchmates</div>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Two Column Layout */}
            <div style={{
                display: 'grid',
                gap: 'var(--space-xl)',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
            }}>
                {/* Recent Announcements */}
                <div className="card">
                    <div className="card-header" style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                            <BellIcon />
                            <h3 style={{ fontSize: '1rem', margin: 0 }}>Recent Announcements</h3>
                        </div>
                        <Link href="/announcements" style={{
                            fontSize: '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                        }}>
                            View all <ArrowRightIcon />
                        </Link>
                    </div>
                    <div className="card-body">
                        <div className="empty-state" style={{ padding: 'var(--space-xl)' }}>
                            <BellIcon />
                            <p style={{ marginTop: 'var(--space-md)', fontSize: '0.875rem' }}>
                                No announcements yet
                            </p>
                        </div>
                    </div>
                </div>

                {/* Upcoming Events */}
                <div className="card">
                    <div className="card-header" style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                            <CalendarIcon />
                            <h3 style={{ fontSize: '1rem', margin: 0 }}>Upcoming Events</h3>
                        </div>
                        <Link href="/events" style={{
                            fontSize: '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                        }}>
                            View all <ArrowRightIcon />
                        </Link>
                    </div>
                    <div className="card-body">
                        <div className="empty-state" style={{ padding: 'var(--space-xl)' }}>
                            <CalendarIcon />
                            <p style={{ marginTop: 'var(--space-md)', fontSize: '0.875rem' }}>
                                No upcoming events
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin Quick Actions */}
            {isAdmin && (
                <div style={{ marginTop: 'var(--space-2xl)' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>Admin Actions</h2>
                    <div className="card">
                        <div className="card-body" style={{
                            display: 'flex',
                            gap: 'var(--space-md)',
                            flexWrap: 'wrap'
                        }}>
                            <Link href="/admin" className="btn btn-primary">
                                Admin Panel
                            </Link>
                            <Link href="/admin/import" className="btn btn-secondary">
                                Bulk Import
                            </Link>
                            <Link href="/admin/feedback" className="btn btn-secondary">
                                View Feedback
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
