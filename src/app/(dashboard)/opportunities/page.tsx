'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const TrendingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
        <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
);

export default function OpportunitiesPage() {
    const [opportunities, setOpportunities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOpportunities();
    }, []);

    const fetchOpportunities = async () => {
        try {
            const supabase = createClient();
            const { data } = await supabase
                .from('opportunities')
                .select('*')
                .order('created_at', { ascending: false });
            setOpportunities(data || []);
        } catch (err) {
            console.error('Error fetching opportunities:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: 'var(--space-xl)' }}>
                <h1 style={{ fontSize: '1.75rem', marginBottom: 'var(--space-xs)' }}>Opportunities</h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Job openings, internships, and referral opportunities shared by the cohort
                </p>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
                    <p>Loading opportunities...</p>
                </div>
            ) : opportunities.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
                    <div style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
                        <TrendingIcon />
                    </div>
                    <h3 style={{ marginBottom: 'var(--space-sm)' }}>No Opportunities Yet</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Job postings and referral opportunities will appear here.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                    {opportunities.map((opp) => (
                        <div key={opp.id} className="card">
                            <div className="card-body">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3>{opp.title}</h3>
                                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
                                            {opp.company}
                                        </p>
                                    </div>
                                    <span className="badge badge-primary">{opp.type}</span>
                                </div>
                                <p style={{ color: 'var(--text-secondary)' }}>{opp.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
