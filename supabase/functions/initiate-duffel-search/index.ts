import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// This function is now PUBLIC: no authentication required
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const { searchParams } = await req.json()

    // Validate search parameters
    if (!searchParams.origin || !searchParams.destination || !searchParams.departureDate || !searchParams.passengers) {
      throw new Error('Missing required search parameters')
    }

    // Create job record (user_id is null for guests)
    const { data: job, error: jobError } = await supabaseClient
      .from('duffel_jobs')
      .insert({
        user_id: null,
        status: 'pending',
        search_params: searchParams,
      })
      .select()
      .single()

    if (jobError) {
      throw new Error(`Failed to create job: ${jobError.message}`)
    }

    // Publish message to QStash using direct fetch
    const QSTASH_URL = Deno.env.get('QSTASH_URL') ?? 'https://qstash.upstash.io/v2/publish';
    const QSTASH_TOKEN = Deno.env.get('QSTASH_TOKEN') ?? '';
    const FUNCTION_URL = Deno.env.get('FUNCTION_URL') ?? '';
    const QSTASH_CURRENT_SIGNING_KEY = Deno.env.get('QSTASH_CURRENT_SIGNING_KEY') ?? '';

    const qstashRes = await fetch(QSTASH_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: `${FUNCTION_URL}/process-duffel-job`,
        body: { job_id: job.id },
        headers: {
          'Authorization': `Bearer ${QSTASH_CURRENT_SIGNING_KEY}`,
        },
      }),
    });

    if (!qstashRes.ok) {
      const errorText = await qstashRes.text();
      throw new Error(`Failed to publish to QStash: ${errorText}`);
    }

    return new Response(
      JSON.stringify({
        job_id: job.id,
        status: 'pending',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 202,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 