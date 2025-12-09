import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateAIResponse, buildContextFromData, AI_PROMPTS } from '@/lib/ai';

// Create a Supabase client for server-side operations
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const { message, conversationHistory = [] } = await request.json();

        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        // Check if API key is configured
        if (!process.env.GOOGLE_GEMINI_API_KEY) {
            return NextResponse.json(
                { error: 'AI service not configured. Please add GOOGLE_GEMINI_API_KEY to your environment.' },
                { status: 500 }
            );
        }

        // Fetch relevant data for context (RAG)
        const [interviewsResult, resourcesResult, announcementsResult] = await Promise.all([
            supabase
                .from('interview_experiences')
                .select('company, role, content')
                .order('upvotes', { ascending: false })
                .limit(10),
            supabase
                .from('resources')
                .select('title, description, category')
                .limit(10),
            supabase
                .from('announcements')
                .select('title, content')
                .order('created_at', { ascending: false })
                .limit(5)
        ]);

        // Build context from fetched data
        const context = buildContextFromData({
            interviews: interviewsResult.data || [],
            resources: resourcesResult.data || [],
            announcements: announcementsResult.data || []
        });

        // Build conversation context
        let conversationContext = '';
        if (conversationHistory.length > 0) {
            conversationContext = '\n\nPrevious conversation:\n';
            conversationHistory.slice(-6).forEach((msg: { role: string; content: string }) => {
                conversationContext += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
            });
        }

        // Construct the full prompt
        const fullContext = `${AI_PROMPTS.chatBot}

Here is the available information from the MBA cohort website:

${context}
${conversationContext}

Based on the above context, please answer the user's question. If the question is not related to the available information, you can still try to help with general advice.`;

        // Generate response
        const response = await generateAIResponse(message, fullContext);

        return NextResponse.json({
            response,
            success: true
        });

    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: 'Failed to process your request. Please try again.' },
            { status: 500 }
        );
    }
}
