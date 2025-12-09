// Database Types for MBA Cohort Application
export interface User {
    id: string;
    email: string;
    name: string;
    profile_picture?: string;
    linkedin_url?: string;
    domain?: string;
    specialization?: string;
    bio?: string;
    company?: string;
    phone?: string;
    is_admin: boolean;
    created_at: string;
    // Enhanced profile fields
    total_experience?: string;
    education?: Array<{
        college: string;
        years: string;
        degree: string;
    }>;
    work_experience?: Array<{
        company: string;
        designation: string;
        from: string;
        to: string;
        duration?: string;
        description?: string[];
    }>;
    certifications?: Array<{
        title: string;
        description?: string;
        year?: string;
    }>;
    accomplishments?: Array<{
        title: string;
        description: string;
    }>;
    functional_areas?: string[];
}

export interface InterviewExperience {
    id: string;
    user_id: string;
    company: string;
    role: string;
    domain: string;
    content: string;
    upvotes: number;
    downvotes: number;
    created_at: string;
    updated_at?: string;
    // Joined fields
    user?: User;
    user_vote?: 'up' | 'down' | null;
}

export interface Vote {
    id: string;
    user_id: string;
    experience_id: string;
    is_upvote: boolean;
}

export interface Resume {
    id: string;
    user_id: string;
    file_url: string;
    name: string;
    domain: string;
    target_company?: string;
    created_at: string;
    // Joined fields
    user?: User;
}

export interface Event {
    id: string;
    title: string;
    description?: string;
    event_date: string;
    end_date?: string;
    location?: string;
    event_type: 'academic' | 'social' | 'workshop' | 'other';
    created_by: string;
    created_at: string;
    // Joined fields
    creator?: User;
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    is_pinned: boolean;
    created_by: string;
    created_at: string;
    // Joined fields
    creator?: User;
}

export interface Resource {
    id: string;
    title: string;
    description?: string;
    category: string;
    file_url?: string;
    external_url?: string;
    uploaded_by: string;
    created_at: string;
    // Joined fields
    uploader?: User;
}

export interface GalleryImage {
    id: string;
    album_name: string;
    image_url: string;
    caption?: string;
    uploaded_by: string;
    created_at: string;
    // Joined fields
    uploader?: User;
}

export interface Opportunity {
    id: string;
    title: string;
    company: string;
    type: 'full-time' | 'internship' | 'referral' | 'project';
    description: string;
    application_url?: string;
    deadline?: string;
    posted_by: string;
    created_at: string;
    // Joined fields
    poster?: User;
}

export interface Feedback {
    id: string;
    user_id: string;
    message: string;
    category?: 'bug' | 'feature' | 'general';
    created_at: string;
    // Joined fields
    user?: User;
}

// Domains for filtering
export const DOMAINS = [
    'Finance',
    'Marketing',
    'Operations',
    'HR',
    'Strategy',
    'Consulting',
    'Technology',
    'Analytics',
    'General Management',
    'Supply Chain',
    'Other'
] as const;

export type Domain = typeof DOMAINS[number];

// Event types
export const EVENT_TYPES = [
    'academic',
    'social',
    'workshop',
    'other'
] as const;

export type EventType = typeof EVENT_TYPES[number];

// Opportunity types
export const OPPORTUNITY_TYPES = [
    'full-time',
    'internship',
    'referral',
    'project'
] as const;

export type OpportunityType = typeof OPPORTUNITY_TYPES[number];
