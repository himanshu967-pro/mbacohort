'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { User } from '@/types';
import { CompanyLogo } from '@/components/ui';

// Icons
const ArrowLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 19-7-7 7-7"></path>
        <path d="M19 12H5"></path>
    </svg>
);

const LinkedInIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
);

const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="16" x="2" y="4" rx="2"></rect>
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
    </svg>
);

const PhoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
);

const BriefcaseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="7" rx="2" ry="2"></rect>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
    </svg>
);

const GraduationCapIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
        <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
    </svg>
);

const AwardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="6"></circle>
        <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path>
    </svg>
);

const BadgeCheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"></path>
        <path d="m9 12 2 2 4-4"></path>
    </svg>
);

const LoaderIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
    </svg>
);

export default function MemberProfilePage() {
    const params = useParams();
    const router = useRouter();
    const [member, setMember] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchMember();
    }, [params.id]);

    const fetchMember = async () => {
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', params.id)
                .single();

            if (error) throw error;
            setMember(data);
        } catch (err) {
            console.error('Error fetching member:', err);
            setError('Member not found');
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <LoaderIcon />
            </div>
        );
    }

    if (error || !member) {
        return (
            <div style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
                <h2 style={{ marginBottom: 'var(--space-md)' }}>Member Not Found</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
                    The member you&apos;re looking for doesn&apos;t exist or has been removed.
                </p>
                <Link href="/members" className="btn btn-primary">
                    <ArrowLeftIcon />
                    Back to Members
                </Link>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Back Button */}
            <Link
                href="/members"
                className="btn btn-ghost"
                style={{ marginBottom: 'var(--space-lg)', display: 'inline-flex' }}
            >
                <ArrowLeftIcon />
                Back to Members
            </Link>

            {/* Profile Header Card */}
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="card-body" style={{ padding: 'var(--space-xl)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-xl)', flexWrap: 'wrap' }}>
                        {/* Avatar */}
                        <div style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            background: 'var(--gradient-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '2.5rem',
                            fontWeight: 600,
                            flexShrink: 0
                        }}>
                            {member.profile_picture ? (
                                <img
                                    src={member.profile_picture}
                                    alt={member.name}
                                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                />
                            ) : (
                                getInitials(member.name || 'U')
                            )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1 }}>
                            <h1 style={{ fontSize: '1.75rem', marginBottom: 'var(--space-xs)' }}>
                                {member.name}
                            </h1>

                            {member.specialization && (
                                <p style={{
                                    color: 'var(--text-secondary)',
                                    fontSize: '1rem',
                                    marginBottom: 'var(--space-md)'
                                }}>
                                    {member.specialization}
                                </p>
                            )}

                            {/* Tags */}
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: 'var(--space-lg)', alignItems: 'center' }}>
                                {member.domain && (
                                    <span className="badge badge-primary">{member.domain}</span>
                                )}
                                {member.company && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.25rem 0.75rem 0.25rem 0.25rem',
                                        background: 'var(--gray-100)',
                                        borderRadius: 'var(--radius-full)',
                                    }}>
                                        <CompanyLogo company={member.company.split(',')[0].trim()} size="sm" />
                                        <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                                            {member.company.split(',')[0].trim()}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                                {member.email && (
                                    <a
                                        href={`mailto:${member.email}`}
                                        className="btn btn-primary"
                                    >
                                        <MailIcon />
                                        Send Email
                                    </a>
                                )}
                                {member.linkedin_url && (
                                    <a
                                        href={member.linkedin_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-secondary"
                                    >
                                        <LinkedInIcon />
                                        LinkedIn
                                    </a>
                                )}
                                {member.phone && (
                                    <a
                                        href={`tel:${member.phone}`}
                                        className="btn btn-secondary"
                                    >
                                        <PhoneIcon />
                                        Call
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Details Grid */}
            <div style={{ display: 'grid', gap: 'var(--space-lg)', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                {/* Bio Card */}
                {member.bio && (
                    <div className="card" style={{ gridColumn: '1 / -1' }}>
                        <div className="card-body">
                            <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}>About</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                                {member.bio}
                            </p>
                        </div>
                    </div>
                )}

                {/* Professional Info */}
                <div className="card">
                    <div className="card-body">
                        <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}>Professional Details</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            {member.company && (
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                        Past Employers
                                    </div>
                                    <div style={{ color: 'var(--text-primary)' }}>{member.company}</div>
                                </div>
                            )}
                            {member.domain && (
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                        Domain / Industry
                                    </div>
                                    <div style={{ color: 'var(--text-primary)' }}>{member.domain}</div>
                                </div>
                            )}
                            {member.specialization && (
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                        Specialization / Role
                                    </div>
                                    <div style={{ color: 'var(--text-primary)' }}>{member.specialization}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="card">
                    <div className="card-body">
                        <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}>Contact Information</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            {member.email && (
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                        Email
                                    </div>
                                    <a
                                        href={`mailto:${member.email}`}
                                        style={{ color: 'var(--primary)' }}
                                    >
                                        {member.email}
                                    </a>
                                </div>
                            )}
                            {member.phone && (
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                        Phone
                                    </div>
                                    <a
                                        href={`tel:${member.phone}`}
                                        style={{ color: 'var(--primary)' }}
                                    >
                                        {member.phone}
                                    </a>
                                </div>
                            )}
                            {member.linkedin_url && (
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                        LinkedIn
                                    </div>
                                    <a
                                        href={member.linkedin_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: 'var(--primary)', wordBreak: 'break-all' }}
                                    >
                                        {member.linkedin_url}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Work Experience Section */}
            {member.work_experience && Array.isArray(member.work_experience) && member.work_experience.length > 0 && (
                <div className="card" style={{ marginTop: 'var(--space-lg)' }}>
                    <div className="card-body">
                        <h3 style={{ fontSize: '1.125rem', marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                            <BriefcaseIcon /> Work Experience
                            {(member as any).total_experience && (
                                <span className="badge badge-secondary" style={{ marginLeft: 'auto', fontWeight: 400 }}>
                                    {(member as any).total_experience}
                                </span>
                            )}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                            {(member.work_experience as any[]).map((exp, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    gap: 'var(--space-md)',
                                    paddingLeft: 'var(--space-md)',
                                    borderLeft: '2px solid var(--primary-light)',
                                    position: 'relative'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        left: '-6px',
                                        top: '4px',
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        background: 'var(--primary)',
                                    }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                            {exp.designation}
                                        </div>
                                        <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                            {exp.company}
                                            <span style={{ color: 'var(--text-muted)', marginLeft: 'var(--space-sm)' }}>
                                                • {exp.from} - {exp.to} {exp.duration && `(${exp.duration})`}
                                            </span>
                                        </div>
                                        {exp.description && Array.isArray(exp.description) && exp.description.length > 0 && (
                                            <ul style={{
                                                margin: 0,
                                                paddingLeft: 'var(--space-lg)',
                                                color: 'var(--text-secondary)',
                                                fontSize: '0.875rem',
                                                lineHeight: 1.6
                                            }}>
                                                {exp.description.slice(0, 3).map((bullet: string, i: number) => (
                                                    <li key={i} style={{ marginBottom: '0.25rem' }}>{bullet}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Education Section */}
            {member.education && Array.isArray(member.education) && member.education.length > 0 && (
                <div className="card" style={{ marginTop: 'var(--space-lg)' }}>
                    <div className="card-body">
                        <h3 style={{ fontSize: '1.125rem', marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                            <GraduationCapIcon /> Education
                        </h3>
                        <div style={{ display: 'grid', gap: 'var(--space-md)', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                            {(member.education as any[]).map((edu, index) => (
                                <div key={index} style={{
                                    padding: 'var(--space-md)',
                                    background: 'var(--gray-50)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--gray-200)'
                                }}>
                                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                        {edu.degree}
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                        {edu.college}
                                    </div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                        {edu.years}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Certifications Section */}
            {member.certifications && Array.isArray(member.certifications) && member.certifications.length > 0 && (
                <div className="card" style={{ marginTop: 'var(--space-lg)' }}>
                    <div className="card-body">
                        <h3 style={{ fontSize: '1.125rem', marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                            <BadgeCheckIcon /> Certifications
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                            {(member.certifications as any[]).map((cert, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    padding: 'var(--space-sm) var(--space-md)',
                                    background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--secondary-light) 100%)',
                                    borderRadius: 'var(--radius-md)',
                                    gap: 'var(--space-md)'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                                            {cert.title}
                                        </div>
                                        {cert.description && (
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.125rem' }}>
                                                {cert.description}
                                            </div>
                                        )}
                                    </div>
                                    {cert.year && (
                                        <span className="badge" style={{ flexShrink: 0 }}>{cert.year}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Accomplishments Section */}
            {member.accomplishments && Array.isArray(member.accomplishments) && member.accomplishments.length > 0 && (
                <div className="card" style={{ marginTop: 'var(--space-lg)' }}>
                    <div className="card-body">
                        <h3 style={{ fontSize: '1.125rem', marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                            <AwardIcon /> Accomplishments
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            {(member.accomplishments as any[]).map((acc, index) => (
                                <div key={index} style={{
                                    padding: 'var(--space-md)',
                                    borderLeft: '3px solid var(--warning)',
                                    background: 'var(--warning-light)',
                                    borderRadius: '0 var(--radius-md) var(--radius-md) 0'
                                }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                        🏆 {acc.title}
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                        {acc.description}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
