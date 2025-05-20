import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { QStash } from 'https://esm.sh/@upstash/qstash@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

    // Get the user's session
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Invalid user session')
    }

    // Parse request body
    const { searchParams } = await req.json()

    // Validate search parameters
    if (!searchParams.origin || !searchParams.destination || !searchParams.departureDate || !searchParams.passengers) {
      throw new Error('Missing required search parameters')
    }

    // Create job record
    const { data: job, error: jobError } = await supabaseClient
      .from('duffel_jobs')
      .insert({
        user_id: user.id,
        status: 'pending',
        search_params: searchParams,
      })
      .select()
      .single()

    if (jobError) {
      throw new Error(`Failed to create job: ${jobError.message}`)
    }

    // Initialize QStash client
    const qstash = new QStash({
      token: Deno.env.get('QSTASH_TOKEN') ?? '',
    })

    // Publish message to QStash
    await qstash.publishJSON({
      url: `${Deno.env.get('SUPABASE_FUNCTION_URL')}/process-duffel-job`,
      body: {
        job_id: job.id,
      },
      headers: {
        'Authorization': `Bearer ${Deno.env.get('QSTASH_CURRENT_SIGNING_KEY')}`,
      },
    })

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