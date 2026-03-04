import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * Path: frontend/src/app/api/cron/route.ts
 * Triggered by Vercel Cron.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  
  if (!secret) {
    console.error('[CRON] Configuration Error: CRON_SECRET is missing.');
    return new Response('Server Configuration Error', { status: 500 });
  }

  if (authHeader !== `Bearer ${secret}`) {
    console.warn('[CRON] Unauthorized access attempt.');
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch the value to verify data connectivity
    const { data, error } = await supabase
      .from('clan_settings')
      .select('clan_name')
      .limit(1);

    if (error) throw error;

    // This log will appear in the "Logs" tab of your Vercel Deployment
    console.log('[CRON] Successfully fetched data:', JSON.stringify(data));

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Database pinged successfully.",
      fetched_name: data && data.length > 0 ? data[0].clan_name : "No records found",
      raw_data: data 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('[CRON] Execution Error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

