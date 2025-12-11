import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client for server-side operations
// This initialization at module level helps warm up the connection
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Warmup endpoint to prevent Vercel cold starts
 * 
 * This endpoint should be pinged every 10-15 minutes by an external service
 * like Cron-Job.org or UptimeRobot to keep the serverless function warm.
 * 
 * It performs:
 * 1. Supabase connection initialization (happens at module level)
 * 2. A lightweight database query to verify the connection
 * 3. Environment validation for critical services
 */
export async function GET() {
    const startTime = Date.now();

    try {
        // Perform a lightweight query to warm up the database connection
        // This query is intentionally minimal - just checks the connection works
        const { error: dbError } = await supabase
            .from('profiles')
            .select('id')
            .limit(1);

        // Check if Gemini API key is configured (for AI features)
        const hasGeminiKey = !!process.env.GOOGLE_GEMINI_API_KEY;

        const responseTime = Date.now() - startTime;

        // Log for monitoring in Vercel Function Logs
        console.log(`[Warmup] Request received at ${new Date().toISOString()} - Response time: ${responseTime}ms`);

        if (dbError) {
            console.error('[Warmup] Database connection error:', dbError.message);
            return NextResponse.json({
                status: 'partial',
                message: 'Warmup completed with warnings',
                database: 'error',
                ai: hasGeminiKey ? 'ready' : 'not configured',
                responseTimeMs: responseTime,
                timestamp: new Date().toISOString()
            }, { status: 200 }); // Still return 200 to not trigger alerts
        }

        return NextResponse.json({
            status: 'ok',
            message: 'All systems warmed up',
            database: 'connected',
            ai: hasGeminiKey ? 'ready' : 'not configured',
            responseTimeMs: responseTime,
            timestamp: new Date().toISOString()
        }, { status: 200 });

    } catch (error) {
        const responseTime = Date.now() - startTime;
        console.error('[Warmup] Unexpected error:', error);

        return NextResponse.json({
            status: 'error',
            message: 'Warmup encountered an error',
            responseTimeMs: responseTime,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

// Also support HEAD requests for minimal overhead health checks
export async function HEAD() {
    return new NextResponse(null, { status: 200 });
}
