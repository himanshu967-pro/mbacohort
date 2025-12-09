import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateAIResponse, AI_PROMPTS } from '@/lib/ai';

// Create a Supabase client for server-side operations
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const {
            message,
            company,
            role,
            interviewType = 'behavioral',
            conversationHistory = [],
            mode = 'interview' // 'interview' or 'feedback'
        } = await request.json();

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

        // Fetch relevant interview experiences for context
        let interviewContext = '';
        if (company) {
            const { data: experiences } = await supabase
                .from('interview_experiences')
                .select('company, role, content')
                .ilike('company', `%${company}%`)
                .limit(5);

            if (experiences && experiences.length > 0) {
                interviewContext = '\n\n## Real Interview Experiences from this company:\n';
                experiences.forEach((exp, i) => {
                    interviewContext += `${i + 1}. **${exp.role}**: ${exp.content.slice(0, 400)}...\n\n`;
                });
            }
        }

        // Build conversation context
        let conversationContext = '';
        if (conversationHistory.length > 0) {
            conversationContext = '\n\nConversation so far:\n';
            conversationHistory.slice(-10).forEach((msg: { role: string; content: string }) => {
                const roleName = msg.role === 'user' ? 'Candidate' : 'Interviewer';
                conversationContext += `${roleName}: ${msg.content}\n`;
            });
        }

        // Determine prompt based on mode
        let systemPrompt = '';

        if (mode === 'feedback') {
            systemPrompt = `${AI_PROMPTS.interviewPrep}

The candidate just gave this response to an interview question. Provide constructive feedback on:
1. Strengths of the answer
2. Areas for improvement
3. A suggested better way to phrase it (if applicable)
4. A follow-up question they might expect

Be encouraging but specific. Keep feedback concise and actionable.`;
        } else {
            systemPrompt = `${AI_PROMPTS.interviewPrep}

You are conducting a mock interview for the following:
- Company: ${company || 'General'}
- Role: ${role || 'MBA Position'}
- Interview Type: ${interviewType}

${interviewContext}

Based on the conversation so far, ask the next appropriate interview question or respond to the candidate's answer.
If starting a new interview, begin with a warm introduction and your first question.
Mix behavioral questions (STAR format expected), situational questions, and role-specific questions.
After 4-5 questions, offer to wrap up or continue.`;
        }

        const fullContext = `${systemPrompt}${conversationContext}`;

        // Generate response
        const response = await generateAIResponse(message, fullContext);

        return NextResponse.json({
            response,
            success: true
        });

    } catch (error) {
        console.error('Interview Prep API error:', error);
        return NextResponse.json(
            { error: 'Failed to process your request. Please try again.' },
            { status: 500 }
        );
    }
}
