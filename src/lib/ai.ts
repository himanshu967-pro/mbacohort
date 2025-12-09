import { GoogleGenerativeAI } from '@google/generative-ai';

// Lazy-initialized Gemini client (to ensure env vars are loaded)
let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
    if (!genAI) {
        const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GOOGLE_GEMINI_API_KEY is not configured');
        }
        genAI = new GoogleGenerativeAI(apiKey);
    }
    return genAI;
}

// Get the Gemini Pro model
export function getGeminiModel() {
    return getGenAI().getGenerativeModel({ model: 'gemini-2.5-flash' });
}

// Chat completion helper
export async function generateAIResponse(
    prompt: string,
    systemContext?: string
): Promise<string> {
    try {
        const model = getGeminiModel();

        const fullPrompt = systemContext
            ? `${systemContext}\n\nUser Query: ${prompt}`
            : prompt;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('AI generation error:', error);
        throw new Error('Failed to generate AI response');
    }
}

// Context builder for RAG
export function buildContextFromData(data: {
    interviews?: Array<{ company: string; role: string; content: string }>;
    resources?: Array<{ title: string; description: string | null; category: string }>;
    announcements?: Array<{ title: string; content: string }>;
}): string {
    let context = '';

    if (data.interviews && data.interviews.length > 0) {
        context += '## Interview Experiences:\n';
        data.interviews.forEach((exp, i) => {
            context += `${i + 1}. **${exp.company} - ${exp.role}**: ${exp.content.slice(0, 500)}...\n\n`;
        });
    }

    if (data.resources && data.resources.length > 0) {
        context += '\n## Resources:\n';
        data.resources.forEach((res, i) => {
            context += `${i + 1}. **${res.title}** (${res.category}): ${res.description || 'No description'}\n`;
        });
    }

    if (data.announcements && data.announcements.length > 0) {
        context += '\n## Announcements:\n';
        data.announcements.forEach((ann, i) => {
            context += `${i + 1}. **${ann.title}**: ${ann.content.slice(0, 200)}...\n`;
        });
    }

    return context;
}

// System prompts for different AI features
export const AI_PROMPTS = {
    chatBot: `You are a helpful AI assistant for an MBA cohort community website. 
You help members find information about:
- Interview experiences shared by batchmates
- Resources and study materials
- Announcements and events
- Member profiles and networking

Be friendly, concise, and helpful. If you don't have specific information, say so honestly.
Always base your answers on the provided context when available.`,

    interviewPrep: `You are an expert interview coach helping MBA students prepare for job interviews.
Your role is to:
1. Act as an interviewer and ask realistic interview questions
2. Provide constructive feedback on responses
3. Share tips and best practices
4. Reference real interview experiences when relevant

Be encouraging but honest. Focus on helping them improve.`,

    linkedInParser: `You are a profile data extraction expert. 
Extract structured information from the provided LinkedIn profile data.
Return ONLY valid JSON with these fields:
{
  "name": "Full Name",
  "company": "Current Company",
  "bio": "Brief professional summary (2-3 sentences)",
  "domain": "One of: Marketing, Finance, Consulting, Operations, Strategy, Analytics, HR, IT, General Management",
  "specialization": "Specific area of expertise",
  "linkedin_url": "LinkedIn URL if found"
}
If a field cannot be determined, use null.`
};
