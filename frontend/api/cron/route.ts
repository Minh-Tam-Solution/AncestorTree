import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * Path: app/api/cron/route.ts
 * This handler is triggered by Vercel Cron.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  // 1. Verify the request is coming from Vercel's Cron scheduler
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error('Unauthorized cron attempt');
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 2. Initialize Supabase using the Service Role Key
    // This BYPASSES all login requirements and RLS policies
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 3. Ping the database to record activity
    const { error } = await supabase
      .from('clan_settings')
      .select('clan_name')
      .limit(1);

    if (error) throw error;

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Keep-alive successful" 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('Cron error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
