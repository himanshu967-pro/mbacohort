'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { DOMAINS } from '@/types';

// Icons
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

const KeyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="7.5" cy="15.5" r="5.5"></circle>
        <path d="m21 2-9.6 9.6"></path>
        <path d="m15.5 7.5 3 3L22 7l-3-3"></path>
    </svg>
);

const MessageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
);

const LogOutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" x2="9" y1="12" y2="12"></line>
    </svg>
);

const LoaderIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
    </svg>
);

const LinkedInIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
);

const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
    </svg>
);

const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
        <circle cx="12" cy="13" r="3"></circle>
    </svg>
);

export default function SettingsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
        linkedin_url: '',
        domain: '',
        specialization: '',
        company: '',
        bio: '',
        profile_picture: '',
    });

    const [feedback, setFeedback] = useState({
        category: 'general',
        message: '',
    });

    // LinkedIn import modal state
    const [showLinkedInModal, setShowLinkedInModal] = useState(false);
    const [linkedinData, setLinkedinData] = useState('');
    const [parsingLinkedIn, setParsingLinkedIn] = useState(false);
    const [uploadingPicture, setUploadingPicture] = useState(false);
    const [parsedProfile, setParsedProfile] = useState<{
        name?: string | null;
        company?: string | null;
        bio?: string | null;
        domain?: string | null;
        specialization?: string | null;
        linkedin_url?: string | null;
    } | null>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            if (data) {
                setProfile({
                    name: data.name || '',
                    email: data.email || user.email || '',
                    phone: data.phone || '',
                    linkedin_url: data.linkedin_url || '',
                    domain: data.domain || '',
                    specialization: data.specialization || '',
                    company: data.company || '',
                    bio: data.bio || '',
                    profile_picture: data.profile_picture || '',
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setProfile((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('users')
                .update({
                    name: profile.name,
                    phone: profile.phone,
                    linkedin_url: profile.linkedin_url,
                    domain: profile.domain,
                    specialization: profile.specialization,
                    company: profile.company,
                    bio: profile.bio,
                })
                .eq('id', user.id);

            if (error) throw error;

            setSuccess('Profile updated successfully!');
        } catch (err) {
            console.error('Error updating profile:', err);
            setError('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleFeedbackSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!feedback.message.trim()) {
            setError('Please enter a message');
            return;
        }

        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('feedback')
                .insert({
                    user_id: user.id,
                    category: feedback.category,
                    message: feedback.message.trim(),
                });

            if (error) throw error;

            setFeedback({ category: 'general', message: '' });
            setSuccess('Feedback submitted! Thank you.');
        } catch (err) {
            console.error('Error submitting feedback:', err);
            setError('Failed to submit feedback');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    const handleLinkedInParse = async () => {
        if (!linkedinData.trim()) {
            setError('Please paste your LinkedIn profile data');
            return;
        }

        setParsingLinkedIn(true);
        setError(null);

        try {
            const response = await fetch('/api/ai/parse-linkedin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ linkedinData }),
            });

            const data = await response.json();

            if (data.error) {
                setError(data.error);
            } else if (data.profile) {
                setParsedProfile(data.profile);
            }
        } catch {
            setError('Failed to parse LinkedIn data. Please try again.');
        } finally {
            setParsingLinkedIn(false);
        }
    };

    const applyParsedProfile = () => {
        if (!parsedProfile) return;

        setProfile(prev => ({
            ...prev,
            name: parsedProfile.name || prev.name,
            company: parsedProfile.company || prev.company,
            bio: parsedProfile.bio || prev.bio,
            domain: parsedProfile.domain || prev.domain,
            specialization: parsedProfile.specialization || prev.specialization,
            linkedin_url: parsedProfile.linkedin_url || prev.linkedin_url,
        }));

        setShowLinkedInModal(false);
        setParsedProfile(null);
        setLinkedinData('');
        setSuccess('Profile updated with LinkedIn data! Remember to save.');
    };

    const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image size must be less than 5MB');
            return;
        }

        setUploadingPicture(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload-profile-picture', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Upload failed');
            }

            setProfile(prev => ({ ...prev, profile_picture: result.url }));
            setSuccess('Profile picture updated!');
        } catch (err) {
            console.error('Error uploading picture:', err);
            setError(err instanceof Error ? err.message : 'Failed to upload picture');
        } finally {
            setUploadingPicture(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-3xl)' }}>
                <LoaderIcon />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-title">Settings</h1>
                <p className="page-subtitle">Manage your profile and preferences</p>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                >
                    <UserIcon /> Profile
                </button>
                <button
                    className={`tab ${activeTab === 'security' ? 'active' : ''}`}
                    onClick={() => setActiveTab('security')}
                >
                    <KeyIcon /> Security
                </button>
                <button
                    className={`tab ${activeTab === 'feedback' ? 'active' : ''}`}
                    onClick={() => setActiveTab('feedback')}
                >
                    <MessageIcon /> Feedback
                </button>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div style={{
                    padding: 'var(--space-md)',
                    background: 'var(--success-light)',
                    color: '#065f46',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--space-lg)',
                    fontSize: '0.875rem',
                }}>
                    {success}
                </div>
            )}

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

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <div className="card">
                    <div className="card-body" style={{ padding: 'var(--space-xl)' }}>
                        {/* LinkedIn Import Button */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            marginBottom: 'var(--space-lg)'
                        }}>
                            <button
                                type="button"
                                className="btn btn-accent"
                                onClick={() => setShowLinkedInModal(true)}
                            >
                                <LinkedInIcon />
                                <SparklesIcon />
                                Import from LinkedIn
                            </button>
                        </div>

                        {/* Profile Picture Upload */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            marginBottom: 'var(--space-xl)',
                            paddingBottom: 'var(--space-xl)',
                            borderBottom: '1px solid var(--border-light)'
                        }}>
                            <div style={{ position: 'relative' }}>
                                <div style={{
                                    width: '120px',
                                    height: '120px',
                                    borderRadius: '50%',
                                    background: profile.profile_picture ? 'none' : 'var(--gradient-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '2.5rem',
                                    fontWeight: 600,
                                    overflow: 'hidden',
                                    border: '4px solid var(--gray-100)'
                                }}>
                                    {profile.profile_picture ? (
                                        <img
                                            src={profile.profile_picture}
                                            alt={profile.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        profile.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
                                    )}
                                </div>
                                <label
                                    htmlFor="profile-picture-upload"
                                    style={{
                                        position: 'absolute',
                                        bottom: '0',
                                        right: '0',
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '50%',
                                        background: 'var(--primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        cursor: 'pointer',
                                        border: '3px solid white',
                                        transition: 'transform 0.2s'
                                    }}
                                >
                                    {uploadingPicture ? <LoaderIcon /> : <CameraIcon />}
                                </label>
                                <input
                                    type="file"
                                    id="profile-picture-upload"
                                    accept="image/*"
                                    onChange={handleProfilePictureUpload}
                                    disabled={uploadingPicture}
                                    style={{ display: 'none' }}
                                />
                            </div>
                            <p style={{
                                marginTop: 'var(--space-sm)',
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)'
                            }}>
                                Click the camera icon to upload a profile picture
                            </p>
                        </div>

                        <form onSubmit={handleProfileSubmit}>
                            <div style={{
                                display: 'grid',
                                gap: 'var(--space-lg)',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'
                            }}>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="label" htmlFor="name">Full Name</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        className="input"
                                        value={profile.name}
                                        onChange={handleProfileChange}
                                    />
                                </div>

                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="label" htmlFor="email">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        className="input"
                                        value={profile.email}
                                        disabled
                                        style={{ background: 'var(--gray-100)' }}
                                    />
                                </div>

                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="label" htmlFor="phone">Phone</label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        className="input"
                                        placeholder="+91 98765 43210"
                                        value={profile.phone}
                                        onChange={handleProfileChange}
                                    />
                                </div>

                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="label" htmlFor="linkedin_url">LinkedIn URL</label>
                                    <input
                                        type="url"
                                        id="linkedin_url"
                                        name="linkedin_url"
                                        className="input"
                                        placeholder="https://linkedin.com/in/yourprofile"
                                        value={profile.linkedin_url}
                                        onChange={handleProfileChange}
                                    />
                                </div>

                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="label" htmlFor="domain">Domain</label>
                                    <select
                                        id="domain"
                                        name="domain"
                                        className="input select"
                                        value={profile.domain}
                                        onChange={handleProfileChange}
                                    >
                                        <option value="">Select domain</option>
                                        {DOMAINS.map((domain) => (
                                            <option key={domain} value={domain}>{domain}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="label" htmlFor="company">Current/Target Company</label>
                                    <input
                                        type="text"
                                        id="company"
                                        name="company"
                                        className="input"
                                        placeholder="e.g., McKinsey, Google"
                                        value={profile.company}
                                        onChange={handleProfileChange}
                                    />
                                </div>
                            </div>

                            <div className="input-group" style={{ marginTop: 'var(--space-lg)' }}>
                                <label className="label" htmlFor="bio">Bio</label>
                                <textarea
                                    id="bio"
                                    name="bio"
                                    className="input textarea"
                                    placeholder="Tell your batchmates about yourself..."
                                    value={profile.bio}
                                    onChange={handleProfileChange}
                                    style={{ minHeight: '100px' }}
                                />
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                marginTop: 'var(--space-xl)'
                            }}>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <LoaderIcon />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
                <div className="card">
                    <div className="card-body" style={{ padding: 'var(--space-xl)' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-lg)' }}>Password</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
                            Change your password to keep your account secure.
                        </p>
                        <Link href="/change-password" className="btn btn-secondary">
                            Change Password
                        </Link>

                        <hr style={{ margin: 'var(--space-xl) 0', border: 'none', borderTop: '1px solid var(--border-light)' }} />

                        <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-lg)' }}>Sign Out</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
                            Sign out from your account on this device.
                        </p>
                        <button
                            className="btn"
                            style={{ background: 'var(--error)', color: 'white' }}
                            onClick={handleLogout}
                        >
                            <LogOutIcon />
                            Sign Out
                        </button>
                    </div>
                </div>
            )}

            {/* Feedback Tab */}
            {activeTab === 'feedback' && (
                <div className="card">
                    <div className="card-body" style={{ padding: 'var(--space-xl)' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}>Submit Feedback</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
                            Help us improve the platform by sharing your thoughts, reporting bugs, or suggesting features.
                        </p>

                        <form onSubmit={handleFeedbackSubmit}>
                            <div className="input-group">
                                <label className="label" htmlFor="category">Category</label>
                                <select
                                    id="category"
                                    className="input select"
                                    value={feedback.category}
                                    onChange={(e) => setFeedback(prev => ({ ...prev, category: e.target.value }))}
                                >
                                    <option value="general">General Feedback</option>
                                    <option value="bug">Bug Report</option>
                                    <option value="feature">Feature Request</option>
                                </select>
                            </div>

                            <div className="input-group">
                                <label className="label" htmlFor="message">Message</label>
                                <textarea
                                    id="message"
                                    className="input textarea"
                                    placeholder="Describe your feedback in detail..."
                                    value={feedback.message}
                                    onChange={(e) => setFeedback(prev => ({ ...prev, message: e.target.value }))}
                                    style={{ minHeight: '150px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <LoaderIcon />
                                            Submitting...
                                        </>
                                    ) : (
                                        'Submit Feedback'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* LinkedIn Import Modal */}
            {showLinkedInModal && (
                <div className="modal-backdrop" onClick={() => setShowLinkedInModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <LinkedInIcon />
                                <SparklesIcon />
                                Import from LinkedIn
                            </h3>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setShowLinkedInModal(false)}
                                style={{ padding: '0.25rem' }}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            {!parsedProfile ? (
                                <>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)', fontSize: '0.875rem' }}>
                                        Copy your LinkedIn profile text and paste it below. AI will extract your information automatically.
                                    </p>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-lg)', fontSize: '0.75rem' }}>
                                        <strong>Tip:</strong> Go to your LinkedIn profile → Select all text → Copy → Paste here
                                    </p>
                                    <textarea
                                        className="input textarea"
                                        placeholder="Paste your LinkedIn profile content here..."
                                        value={linkedinData}
                                        onChange={(e) => setLinkedinData(e.target.value)}
                                        style={{ minHeight: '200px', fontFamily: 'monospace', fontSize: '0.8125rem' }}
                                    />
                                </>
                            ) : (
                                <div>
                                    <h4 style={{ marginBottom: 'var(--space-md)', fontSize: '0.9375rem' }}>
                                        ✅ Extracted Profile Data
                                    </h4>
                                    <div style={{
                                        background: 'var(--gray-50)',
                                        padding: 'var(--space-md)',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: '0.875rem'
                                    }}>
                                        {parsedProfile.name && (
                                            <div style={{ marginBottom: '0.5rem' }}>
                                                <strong>Name:</strong> {parsedProfile.name}
                                            </div>
                                        )}
                                        {parsedProfile.company && (
                                            <div style={{ marginBottom: '0.5rem' }}>
                                                <strong>Company:</strong> {parsedProfile.company}
                                            </div>
                                        )}
                                        {parsedProfile.domain && (
                                            <div style={{ marginBottom: '0.5rem' }}>
                                                <strong>Domain:</strong> {parsedProfile.domain}
                                            </div>
                                        )}
                                        {parsedProfile.specialization && (
                                            <div style={{ marginBottom: '0.5rem' }}>
                                                <strong>Specialization:</strong> {parsedProfile.specialization}
                                            </div>
                                        )}
                                        {parsedProfile.bio && (
                                            <div style={{ marginBottom: '0.5rem' }}>
                                                <strong>Bio:</strong> {parsedProfile.bio}
                                            </div>
                                        )}
                                        {parsedProfile.linkedin_url && (
                                            <div>
                                                <strong>LinkedIn:</strong> {parsedProfile.linkedin_url}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => {
                                    setShowLinkedInModal(false);
                                    setParsedProfile(null);
                                    setLinkedinData('');
                                }}
                            >
                                Cancel
                            </button>
                            {!parsedProfile ? (
                                <button
                                    className="btn btn-primary"
                                    onClick={handleLinkedInParse}
                                    disabled={parsingLinkedIn || !linkedinData.trim()}
                                >
                                    {parsingLinkedIn ? (
                                        <>
                                            <LoaderIcon />
                                            Parsing...
                                        </>
                                    ) : (
                                        <>
                                            <SparklesIcon />
                                            Extract with AI
                                        </>
                                    )}
                                </button>
                            ) : (
                                <>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setParsedProfile(null)}
                                    >
                                        Try Again
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={applyParsedProfile}
                                    >
                                        Apply to Profile
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
