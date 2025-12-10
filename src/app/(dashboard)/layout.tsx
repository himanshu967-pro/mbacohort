import { DashboardLayout } from '@/components/layout';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import FeedbackButton from '@/components/features/FeedbackButton';

export default async function DashboardRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get user profile for the layout
    const { data: profile } = await supabase
        .from('users')
        .select('name, email, profile_picture, is_admin')
        .eq('id', user.id)
        .single();

    const userInfo = {
        name: profile?.name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        profile_picture: profile?.profile_picture,
        is_admin: profile?.is_admin || false,
    };

    return (
        <DashboardLayout user={userInfo}>
            {children}
            <FeedbackButton />
        </DashboardLayout>
    );
}
