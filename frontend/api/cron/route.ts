import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * This route is triggered by Vercel Cron.
 * It bypasses the UI login by using the Supabase Service Role Key.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  // 1. Security check: Only allow Vercel's Cron system to call this
  // CRON_SECRET is automatically provided by Vercel in production
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error('Unauthorized cron attempt blocked');
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 2. Initialize Supabase with the SERVICE_ROLE_KEY.
    // This key BYPASSES Row Level Security (RLS) and the login page logic.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 3. Perform a simple read to trigger activity.
    const { error } = await supabase
      .from('clan_settings')
      .select('clan_name')
      .limit(1);

    if (error) throw error;

    console.log('Keep-alive success: Database pinged successfully.');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Activity recorded, project will not pause.",
        timestamp: new Date().toISOString()
      }), 
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (err: any) {
    console.error('Cron Ping Failed:', err.message);
    return new Response(
      JSON.stringify({ error: err.message }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}