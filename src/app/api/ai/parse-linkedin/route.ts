import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse, AI_PROMPTS } from '@/lib/ai';

export async function POST(request: NextRequest) {
    try {
        const { linkedinData } = await request.json();

        if (!linkedinData || typeof linkedinData !== 'string') {
            return NextResponse.json(
                { error: 'LinkedIn data is required' },
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

        // Build prompt with the LinkedIn data
        const prompt = `${AI_PROMPTS.linkedInParser}

Here is the LinkedIn profile data to parse:

---
${linkedinData}
---

Extract the information and return ONLY valid JSON. No markdown, no explanation, just the JSON object.`;

        // Generate response
        const response = await generateAIResponse(prompt);

        // Try to parse the JSON response
        try {
            // Clean up the response - remove any markdown formatting
            let cleanedResponse = response.trim();

            // Remove markdown code block if present
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse
                    .replace(/^```json?\n?/, '')
                    .replace(/\n?```$/, '');
            }

            const parsedProfile = JSON.parse(cleanedResponse);

            // Validate the parsed data has expected shape
            const validatedProfile = {
                name: parsedProfile.name || null,
                company: parsedProfile.company || null,
                bio: parsedProfile.bio || null,
                domain: parsedProfile.domain || null,
                specialization: parsedProfile.specialization || null,
                linkedin_url: parsedProfile.linkedin_url || null,
            };

            return NextResponse.json({
                profile: validatedProfile,
                success: true
            });

        } catch {
            // If JSON parsing fails, return the raw response for debugging
            return NextResponse.json({
                error: 'Failed to parse profile data. Please try again with cleaner input.',
                rawResponse: response.slice(0, 200),
                success: false
            }, { status: 422 });
        }

    } catch (error) {
        console.error('LinkedIn Parse API error:', error);
        return NextResponse.json(
            { error: 'Failed to process your request. Please try again.' },
            { status: 500 }
        );
    }
}
