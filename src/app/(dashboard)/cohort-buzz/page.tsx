'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

// Icons
const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m22 2-7 20-4-9-9-4Z"></path>
        <path d="M22 2 11 13"></path>
    </svg>
);

const MessageCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path>
    </svg>
);

const MaskIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4Z"></path>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Z"></path>
        <path d="M2 12h4"></path>
        <path d="M18 12h4"></path>
    </svg>
);

const REACTIONS = [
    { emoji: '🔥', label: 'Fire' },
    { emoji: '💯', label: 'Hundred' },
    { emoji: '😂', label: 'Haha' },
    { emoji: '❤️', label: 'Love' },
    { emoji: '👏', label: 'Clap' },
    { emoji: '🤔', label: 'Think' },
];

const CATEGORIES = [
    { value: 'general', label: '💬 General', color: '#6366f1' },
    { value: 'confession', label: '🎭 Confession', color: '#ec4899' },
    { value: 'win', label: '🏆 Win', color: '#f59e0b' },
    { value: 'question', label: '❓ Question', color: '#10b981' },
    { value: 'meme', label: '😂 Meme', color: '#8b5cf6' },
    { value: 'rant', label: '😤 Rant', color: '#ef4444' },
];

interface Post {
    id: string;
    user_id: string | null;
    content: string;
    is_anonymous: boolean;
    category: string;
    reactions: Record<string, string[]>; // emoji -> user_ids
    created_at: string;
    user?: { id: string; name: string; profile_picture?: string };
    comments?: Comment[];
}

interface Comment {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    user?: { id: string; name: string; profile_picture?: string };
}

export default function CohortBuzzPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [newPost, setNewPost] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [category, setCategory] = useState('general');
    const [posting, setPosting] = useState(false);
    const [expandedPost, setExpandedPost] = useState<string | null>(null);
    const [newComment, setNewComment] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string>();
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchPosts();
        fetchCurrentUser();
    }, []);

    const fetchCurrentUser = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id);
    };

    const fetchPosts = async () => {
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('buzz_posts')
                .select(`
                    *,
                    user:users(id, name, profile_picture)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPosts(data || []);
        } catch (err) {
            console.error('Error fetching posts:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async (postId: string) => {
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('comments')
                .select(`*, user:users(id, name, profile_picture)`)
                .eq('parent_type', 'buzz')
                .eq('parent_id', postId)
                .order('created_at', { ascending: true });

            if (!error && data) {
                setPosts(prev => prev.map(p =>
                    p.id === postId ? { ...p, comments: data } : p
                ));
            }
        } catch (err) {
            console.error('Error fetching comments:', err);
        }
    };

    const handlePost = async () => {
        if (!newPost.trim() || !currentUserId) return;

        setPosting(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.from('buzz_posts').insert({
                user_id: isAnonymous ? null : currentUserId,
                content: newPost.trim(),
                is_anonymous: isAnonymous,
                category,
                reactions: {}
            });

            if (!error) {
                setNewPost('');
                setIsAnonymous(false);
                setCategory('general');
                fetchPosts();
            }
        } catch (err) {
            console.error('Error posting:', err);
        } finally {
            setPosting(false);
        }
    };

    const handleReaction = async (postId: string, emoji: string) => {
        if (!currentUserId) return;

        try {
            const supabase = createClient();
            const post = posts.find(p => p.id === postId);
            if (!post) return;

            const reactions = { ...post.reactions };
            const userReactions = reactions[emoji] || [];

            if (userReactions.includes(currentUserId)) {
                reactions[emoji] = userReactions.filter(id => id !== currentUserId);
                if (reactions[emoji].length === 0) delete reactions[emoji];
            } else {
                reactions[emoji] = [...userReactions, currentUserId];
            }

            const { error } = await supabase
                .from('buzz_posts')
                .update({ reactions })
                .eq('id', postId);

            if (!error) {
                setPosts(prev => prev.map(p =>
                    p.id === postId ? { ...p, reactions } : p
                ));
            }
        } catch (err) {
            console.error('Error reacting:', err);
        }
    };

    const handleAddComment = async (postId: string) => {
        if (!newComment.trim() || !currentUserId) return;

        try {
            const supabase = createClient();
            const { error } = await supabase.from('comments').insert({
                user_id: currentUserId,
                content: newComment.trim(),
                parent_type: 'buzz',
                parent_id: postId
            });

            if (!error) {
                setNewComment('');
                fetchComments(postId);
            }
        } catch (err) {
            console.error('Error adding comment:', err);
        }
    };

    const toggleComments = (postId: string) => {
        if (expandedPost === postId) {
            setExpandedPost(null);
        } else {
            setExpandedPost(postId);
            const post = posts.find(p => p.id === postId);
            if (!post?.comments) {
                fetchComments(postId);
            }
        }
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getCategoryInfo = (cat: string) => {
        return CATEGORIES.find(c => c.value === cat) || CATEGORIES[0];
    };

    const filteredPosts = filter === 'all' ? posts : posts.filter(p => p.category === filter);

    return (
        <div>
            {/* Page Header */}
            <div style={{ marginBottom: 'var(--space-xl)' }}>
                <h1 style={{ fontSize: '1.75rem', marginBottom: 'var(--space-xs)' }}>
                    Cohort Buzz 🔥
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Share updates, wins, confessions, and vibes with your batchmates
                </p>
            </div>

            {/* New Post Form */}
            <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                <div className="card-body">
                    <textarea
                        className="input"
                        rows={3}
                        placeholder={isAnonymous ? "Share anonymously... 🎭" : "What's on your mind? 💭"}
                        value={newPost}
                        onChange={e => setNewPost(e.target.value)}
                        style={{ resize: 'none', marginBottom: 'var(--space-md)' }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
                            {/* Category Select */}
                            <select
                                className="input select"
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                style={{ width: 'auto', padding: '0.5rem 1rem' }}
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>

                            {/* Anonymous Toggle */}
                            <button
                                type="button"
                                onClick={() => setIsAnonymous(!isAnonymous)}
                                className={`btn ${isAnonymous ? 'btn-primary' : 'btn-secondary'}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    borderRadius: '50px'
                                }}
                            >
                                <MaskIcon />
                                {isAnonymous ? 'Anonymous' : 'Public'}
                            </button>
                        </div>

                        <button
                            className="btn btn-primary"
                            onClick={handlePost}
                            disabled={posting || !newPost.trim()}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <SendIcon />
                            {posting ? 'Posting...' : 'Post'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Category Filters */}
            <div style={{
                display: 'flex',
                gap: 'var(--space-sm)',
                marginBottom: 'var(--space-xl)',
                flexWrap: 'wrap',
                overflowX: 'auto',
                paddingBottom: 'var(--space-xs)'
            }}>
                <button
                    className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilter('all')}
                    style={{ borderRadius: '50px', whiteSpace: 'nowrap' }}
                >
                    🌐 All
                </button>
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.value}
                        className={`btn ${filter === cat.value ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilter(cat.value)}
                        style={{ borderRadius: '50px', whiteSpace: 'nowrap' }}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Posts Feed */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
                    <p>Loading buzz...</p>
                </div>
            ) : filteredPosts.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>🦗</div>
                    <h3 style={{ marginBottom: 'var(--space-sm)' }}>No buzz yet!</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Be the first to post something!
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    {filteredPosts.map((post) => {
                        const catInfo = getCategoryInfo(post.category);
                        const isExpanded = expandedPost === post.id;
                        const totalReactions = Object.values(post.reactions || {}).reduce((sum, arr) => sum + arr.length, 0);

                        return (
                            <div
                                key={post.id}
                                className="card"
                                style={{
                                    borderLeft: `4px solid ${catInfo.color}`,
                                    transition: 'transform 0.2s'
                                }}
                            >
                                <div className="card-body">
                                    {/* Post Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                            {post.is_anonymous ? (
                                                <div
                                                    className="avatar avatar-placeholder"
                                                    style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                        fontSize: '1.25rem'
                                                    }}
                                                >
                                                    🎭
                                                </div>
                                            ) : post.user?.profile_picture ? (
                                                <img src={post.user.profile_picture} alt="" className="avatar" style={{ width: '40px', height: '40px' }} />
                                            ) : (
                                                <div className="avatar avatar-placeholder" style={{ width: '40px', height: '40px' }}>
                                                    {getInitials(post.user?.name || 'U')}
                                                </div>
                                            )}
                                            <div>
                                                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {post.is_anonymous ? 'Anonymous' : post.user?.name}
                                                    <span
                                                        className="badge"
                                                        style={{
                                                            background: catInfo.color,
                                                            color: 'white',
                                                            fontSize: '0.6875rem',
                                                            padding: '0.125rem 0.5rem'
                                                        }}
                                                    >
                                                        {catInfo.label}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {formatTime(post.created_at)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Post Content */}
                                    <p style={{
                                        fontSize: '1rem',
                                        lineHeight: 1.6,
                                        marginBottom: 'var(--space-md)',
                                        whiteSpace: 'pre-wrap'
                                    }}>
                                        {post.content}
                                    </p>

                                    {/* Reactions */}
                                    <div style={{
                                        display: 'flex',
                                        gap: 'var(--space-xs)',
                                        flexWrap: 'wrap',
                                        marginBottom: 'var(--space-md)'
                                    }}>
                                        {REACTIONS.map(({ emoji }) => {
                                            const count = (post.reactions?.[emoji] || []).length;
                                            const hasReacted = currentUserId && (post.reactions?.[emoji] || []).includes(currentUserId);

                                            return (
                                                <button
                                                    key={emoji}
                                                    onClick={() => handleReaction(post.id, emoji)}
                                                    style={{
                                                        padding: '0.25rem 0.625rem',
                                                        borderRadius: '50px',
                                                        border: hasReacted ? '2px solid var(--primary-500)' : '1px solid var(--border-light)',
                                                        background: hasReacted ? 'var(--primary-50)' : 'transparent',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem',
                                                        fontSize: '0.875rem',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <span>{emoji}</span>
                                                    {count > 0 && <span style={{ fontWeight: 500 }}>{count}</span>}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Comment Toggle */}
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => toggleComments(post.id)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        <MessageCircleIcon />
                                        {post.comments?.length || 0} Comments
                                    </button>

                                    {/* Comments Section */}
                                    {isExpanded && (
                                        <div style={{ marginTop: 'var(--space-lg)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--border-light)' }}>
                                            {post.comments && post.comments.length > 0 && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                                                    {post.comments.map(comment => (
                                                        <div key={comment.id} style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                                            {comment.user?.profile_picture ? (
                                                                <img src={comment.user.profile_picture} alt="" className="avatar avatar-sm" />
                                                            ) : (
                                                                <div className="avatar avatar-sm avatar-placeholder" style={{ width: '28px', height: '28px', fontSize: '0.625rem' }}>
                                                                    {getInitials(comment.user?.name || 'U')}
                                                                </div>
                                                            )}
                                                            <div style={{ flex: 1, background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-sm) var(--space-md)' }}>
                                                                <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{comment.user?.name}</div>
                                                                <p style={{ fontSize: '0.875rem', margin: 0 }}>{comment.content}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                                <input
                                                    type="text"
                                                    className="input"
                                                    placeholder="Write a comment..."
                                                    value={newComment}
                                                    onChange={e => setNewComment(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleAddComment(post.id)}
                                                    style={{ flex: 1 }}
                                                />
                                                <button className="btn btn-primary" onClick={() => handleAddComment(post.id)}>
                                                    Reply
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
