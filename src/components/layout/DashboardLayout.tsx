'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sidebar, MobileMenuButton } from './Sidebar';
import AIChatWidget from '@/components/features/AIChatWidget';
import { FeedbackPopup, EngagementNudge } from '@/components/features';
import { createClient } from '@/lib/supabase/client';

interface DashboardLayoutProps {
    children: React.ReactNode;
    user?: {
        name: string;
        email: string;
        profile_picture?: string;
        is_admin: boolean;
    };
}

// Simple search icon
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.3-4.3"></path>
    </svg>
);

const BellIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
    </svg>
);

const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

const LogOutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" x2="9" y1="12" y2="12"></line>
    </svg>
);

const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m6 9 6 6 6-6"></path>
    </svg>
);

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Get user initials for avatar placeholder
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setProfileDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle logout
    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <div style={{ minHeight: '100vh' }}>
            {/* Sidebar */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                isAdmin={user?.is_admin}
            />

            {/* Main Content Area */}
            <div className="main-content">
                {/* Top Bar */}
                <header className="topbar">
                    <div className="topbar-left">
                        <MobileMenuButton onClick={() => setSidebarOpen(true)} />

                        {/* Search Bar - Desktop */}
                        <div className="search-bar" style={{ width: '300px', display: 'none' }}>
                            <SearchIcon />
                            <input
                                type="text"
                                className="input"
                                placeholder="Search members, events..."
                                style={{ paddingLeft: '2.75rem' }}
                            />
                        </div>
                    </div>

                    <div className="topbar-right">
                        {/* Notifications */}
                        <button
                            className="menu-toggle"
                            style={{ position: 'relative' }}
                        >
                            <BellIcon />
                            {/* Notification badge */}
                            <span
                                style={{
                                    position: 'absolute',
                                    top: '8px',
                                    right: '8px',
                                    width: '8px',
                                    height: '8px',
                                    background: 'var(--error)',
                                    borderRadius: '50%',
                                    border: '2px solid var(--surface)',
                                }}
                            />
                        </button>

                        {/* User Profile with Dropdown */}
                        {user && (
                            <div ref={dropdownRef} style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.25rem 0.5rem',
                                        background: 'transparent',
                                        border: 'none',
                                        borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-100)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    {user.profile_picture ? (
                                        <img
                                            src={user.profile_picture}
                                            alt={user.name}
                                            className="avatar"
                                        />
                                    ) : (
                                        <div
                                            className="avatar avatar-placeholder"
                                            style={{ width: '40px', height: '40px' }}
                                        >
                                            {getInitials(user.name)}
                                        </div>
                                    )}
                                    <ChevronDownIcon />
                                </button>

                                {/* Dropdown Menu */}
                                {profileDropdownOpen && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 'calc(100% + 8px)',
                                            right: 0,
                                            background: 'var(--surface)',
                                            borderRadius: 'var(--radius-lg)',
                                            boxShadow: 'var(--shadow-lg)',
                                            border: '1px solid var(--border-light)',
                                            minWidth: '200px',
                                            overflow: 'hidden',
                                            zIndex: 1000,
                                        }}
                                    >
                                        {/* User Info */}
                                        <div style={{
                                            padding: 'var(--space-md)',
                                            borderBottom: '1px solid var(--border-light)',
                                        }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                                {user.name}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {user.email}
                                            </div>
                                        </div>

                                        {/* Menu Items */}
                                        <div style={{ padding: 'var(--space-xs)' }}>
                                            <Link
                                                href="/settings"
                                                onClick={() => setProfileDropdownOpen(false)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 'var(--space-sm)',
                                                    padding: 'var(--space-sm) var(--space-md)',
                                                    borderRadius: 'var(--radius-md)',
                                                    textDecoration: 'none',
                                                    color: 'var(--text-primary)',
                                                    fontSize: '0.875rem',
                                                    transition: 'background 0.2s',
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-100)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <SettingsIcon />
                                                Settings
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 'var(--space-sm)',
                                                    padding: 'var(--space-sm) var(--space-md)',
                                                    borderRadius: 'var(--radius-md)',
                                                    width: '100%',
                                                    border: 'none',
                                                    background: 'transparent',
                                                    color: 'var(--error)',
                                                    fontSize: '0.875rem',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    transition: 'background 0.2s',
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--error-light)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <LogOutIcon />
                                                Log Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </header>

                {/* Page Content */}
                <main style={{ padding: 'var(--space-lg)' }}>
                    {children}
                </main>
            </div>

            {/* AI Chat Widget */}
            <AIChatWidget />

            {/* Smart Engagement Popups */}
            <FeedbackPopup />
            <EngagementNudge type="experience" />
        </div>
    );
}

