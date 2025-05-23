import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Types
interface FlightSearchParams {
  origin: string
  destination: string
  departureDate: string
  passengers: {
    adults: number
    children?: number
    infants?: number
  }
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first'
}

interface RequestBody {
  searchParams: FlightSearchParams
}

interface JobRecord {
  id: string
  user_id: string | null
  status: string
  search_params: FlightSearchParams
  created_at: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// This function is now PUBLIC: no authentication required
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('[initiate-duffel-search] Request:', {
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
    })

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('[initiate-duffel-search] Missing Supabase env vars')
      return new Response(JSON.stringify({ error: 'Missing Supabase environment variables' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Publish message to QStash using direct fetch
    const QSTASH_URL = 'https://qstash.upstash.io/v2/publish'
    const QSTASH_TOKEN = Deno.env.get('QSTASH_TOKEN') ?? ''
    const FUNCTION_URL = (Deno.env.get('FUNCTION_URL') ?? '').replace(/^"|"$/g, '') // Strip any surrounding quotes
    const QSTASH_CURRENT_SIGNING_KEY = Deno.env.get('QSTASH_CURRENT_SIGNING_KEY') ?? ''

    // Debug logging
    console.log('QStash configuration:', {
      qstashUrl: QSTASH_URL,
      functionUrl: FUNCTION_URL,
      hasToken: !!QSTASH_TOKEN,
      hasSigningKey: !!QSTASH_CURRENT_SIGNING_KEY
    })

    if (!QSTASH_TOKEN || !FUNCTION_URL || !QSTASH_CURRENT_SIGNING_KEY) {
      console.error('[initiate-duffel-search] Missing QStash env vars', {
        hasToken: !!QSTASH_TOKEN,
        hasFunctionUrl: !!FUNCTION_URL,
        hasSigningKey: !!QSTASH_CURRENT_SIGNING_KEY
      })
      return new Response(JSON.stringify({ error: 'Missing QStash environment variables' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    // Extra debug: Log the QStash token (first 6 and last 4 chars for security)
    console.log('[initiate-duffel-search] QStash token (partial):', QSTASH_TOKEN ? QSTASH_TOKEN.slice(0,6) + '...' + QSTASH_TOKEN.slice(-4) : 'undefined');

    // Parse and validate request body
    let body: RequestBody;
    try {
      body = await req.json()
    } catch (err) {
      console.error('[initiate-duffel-search] Invalid JSON:', err)
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const { searchParams } = body
    if (!searchParams?.origin || !searchParams?.destination || !searchParams?.departureDate || !searchParams?.passengers) {
      console.error('[initiate-duffel-search] Missing required search parameters')
      return new Response(JSON.stringify({ error: 'Missing required search parameters' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
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
      console.error('[initiate-duffel-search] Job creation error:', jobError)
      return new Response(JSON.stringify({ error: `Failed to create job: ${jobError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    console.log('[initiate-duffel-search] Job created:', job)

    // Publish message to QStash using direct fetch
    const qstashPayload = {
      url: `${FUNCTION_URL}/process-duffel-job`,
      body: { job_id: job.id },
      headers: {
        'Authorization': `Bearer ${QSTASH_CURRENT_SIGNING_KEY}`,
      },
    }

    let qstashRes
    try {
      qstashRes = await fetch(QSTASH_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${QSTASH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(qstashPayload),
      })
    } catch (err) {
      console.error('[initiate-duffel-search] QStash fetch error:', err)
      return new Response(JSON.stringify({ error: 'Failed to reach QStash' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 502,
      })
    }

    if (!qstashRes.ok) {
      const errorText = await qstashRes.text()
      console.error('[initiate-duffel-search] QStash error:', errorText)
      return new Response(JSON.stringify({ error: `Failed to publish to QStash: ${errorText}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 502,
      })
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
  } catch (error: unknown) {
    console.error('[initiate-duffel-search] Function error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorDetails = error instanceof Error ? error.toString() : String(error)
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: errorDetails,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}) 