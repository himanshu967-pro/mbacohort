import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse } from '@/lib/ai';

const REFINE_PROMPT = `You are an expert content editor for an MBA cohort platform. Your task is to refine and structure interview experience submissions from students.

IMPORTANT RULES:
1. DO NOT change the meaning or add any false information
2. Keep the original voice and authenticity
3. Only improve structure, formatting, and readability
4. Use markdown formatting for headings and lists

FORMAT THE CONTENT WITH THESE SECTIONS (use ## for headings):
1. ## Interview Overview - Brief summary of the company, role, and overall process
2. ## Interview Rounds - Detail each round with bullet points
3. ## Key Questions Asked - List notable questions (if mentioned)
4. ## Preparation Tips - Any tips the author mentioned
5. ## Key Takeaways - Important learnings from the experience

THEN ADD THIS SPECIAL SECTION AT THE END:

## 📌 AI Summary & Prep Guidelines

Write a concise 2-3 sentence summary of the crux of this experience, followed by 3-5 short, actionable preparation tips for others interviewing at this company.

Format the tips as a numbered list, keeping each tip under 15 words.

---

Now refine the following interview experience. Output ONLY the formatted content in markdown, no additional commentary:

`;

export async function POST(request: NextRequest) {
    try {
        const { content, company, role, domain } = await request.json();

        if (!content || typeof content !== 'string') {
            return NextResponse.json(
                { error: 'Content is required' },
                { status: 400 }
            );
        }

        // Check if API key is configured
        if (!process.env.GOOGLE_GEMINI_API_KEY) {
            return NextResponse.json(
                {
                    error: 'AI service not configured',
                    refinedContent: content, // Return original if AI not available
                    aiSummary: null,
                    isRefined: false
                },
                { status: 200 }
            );
        }

        // Add context about the interview
        const contextInfo = `
Company: ${company || 'Not specified'}
Role: ${role || 'Not specified'}
Domain: ${domain || 'Not specified'}

Original Content:
${content}
`;

        // Generate refined content
        const refinedContent = await generateAIResponse(contextInfo, REFINE_PROMPT);

        // Extract the AI Summary section
        const summaryMatch = refinedContent.match(/## 📌 AI Summary & Prep Guidelines([\s\S]*?)(?=##|$)/);
        const aiSummary = summaryMatch ? summaryMatch[1].trim() : null;

        return NextResponse.json({
            refinedContent,
            aiSummary,
            isRefined: true,
            originalContent: content,
            success: true
        });

    } catch (error) {
        console.error('Experience Refinement API error:', error);
        return NextResponse.json(
            {
                error: 'Failed to refine content',
                refinedContent: null,
                isRefined: false
            },
            { status: 500 }
        );
    }
}
