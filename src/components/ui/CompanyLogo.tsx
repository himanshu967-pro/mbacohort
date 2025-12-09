'use client';

import { useState, useEffect } from 'react';

interface CompanyLogoProps {
    company: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    showFallback?: boolean;
}

const sizeMap = {
    sm: { dimension: 24, fontSize: '0.625rem' },
    md: { dimension: 32, fontSize: '0.75rem' },
    lg: { dimension: 48, fontSize: '1rem' },
    xl: { dimension: 64, fontSize: '1.25rem' },
};

export function CompanyLogo({ company, size = 'md', className = '', showFallback = true }: CompanyLogoProps) {
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const { dimension, fontSize } = sizeMap[size];

    useEffect(() => {
        if (!company) {
            setLoading(false);
            return;
        }

        const fetchLogo = async () => {
            try {
                setLoading(true);
                setError(false);

                const response = await fetch(`/api/company-logo?company=${encodeURIComponent(company)}&size=${dimension * 2}`);
                const data = await response.json();

                if (data.found && data.logoUrl) {
                    setLogoUrl(data.logoUrl);
                } else {
                    setLogoUrl(null);
                }
            } catch (err) {
                console.error('Error fetching logo:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchLogo();
    }, [company, dimension]);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Generate a consistent color based on company name
    const getColor = (name: string) => {
        const colors = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
            'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
        ];

        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const baseStyles: React.CSSProperties = {
        width: dimension,
        height: dimension,
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
    };

    // Loading state
    if (loading) {
        return (
            <div
                className={`company-logo-skeleton ${className}`}
                style={{
                    ...baseStyles,
                    background: 'var(--gray-100)',
                    animation: 'pulse 1.5s ease-in-out infinite',
                }}
            />
        );
    }

    // Logo found - show image
    if (logoUrl && !error) {
        return (
            <div className={`company-logo ${className}`} style={baseStyles}>
                <img
                    src={logoUrl}
                    alt={`${company} logo`}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        background: 'white',
                        padding: dimension > 32 ? 4 : 2,
                        borderRadius: 'inherit',
                    }}
                    onError={() => setError(true)}
                />
            </div>
        );
    }

    // Fallback - show initials
    if (!showFallback) {
        return null;
    }

    return (
        <div
            className={`company-logo-fallback ${className}`}
            style={{
                ...baseStyles,
                background: getColor(company),
                color: 'white',
                fontWeight: 600,
                fontSize,
                textShadow: '0 1px 2px rgba(0,0,0,0.2)',
            }}
            title={company}
        >
            {getInitials(company)}
        </div>
    );
}

export default CompanyLogo;
