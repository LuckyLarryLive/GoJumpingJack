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

// Utility function to thoroughly clean environment variables
function cleanEnvVar(value: string | undefined): string {
  if (!value) return '';
  
  // First remove any surrounding quotes and escaped quotes
  let cleaned = value
    .replace(/^["']|["']$/g, '')  // Remove surrounding quotes
    .replace(/\\"/g, '"')  // Replace escaped quotes with regular quotes
    .replace(/\\n/g, '')  // Remove escaped newlines
    .replace(/\s+/g, '')  // Remove all whitespace
    .replace(/[\r\n]+/g, '')  // Remove all newlines
    .trim();  // Final trim

  // If the result is still wrapped in quotes, remove them
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1);
  }

  return cleaned;
}

// This function is now PUBLIC: no authentication required
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Log critical environment variables
    const qstashUrl = Deno.env.get('QSTASH_URL')
    const qstashToken = Deno.env.get('QSTASH_TOKEN')
    console.log('[DEBUG] QSTASH_URL from env:', qstashUrl)
    console.log('[DEBUG] QSTASH_TOKEN (partial) from env:', qstashToken ? `${qstashToken.slice(0,6)}...${qstashToken.slice(-4)}` : 'undefined')

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
    const rawQstashToken = Deno.env.get('QSTASH_TOKEN') ?? ''
    const FUNCTION_URL = cleanEnvVar(Deno.env.get('FUNCTION_URL'))
    const QSTASH_CURRENT_SIGNING_KEY = cleanEnvVar(Deno.env.get('QSTASH_CURRENT_SIGNING_KEY'))

    // Debug logging for QSTASH_TOKEN
    console.log('[DEBUG] QSTASH_TOKEN raw value:', JSON.stringify(rawQstashToken))
    console.log('[DEBUG] QSTASH_TOKEN char codes:', rawQstashToken ? Array.from(rawQstashToken).map(c => `${c}:${c.charCodeAt(0)}`).join(' ') : 'undefined')
    console.log('[DEBUG] QSTASH_TOKEN length:', rawQstashToken?.length)
    console.log('[DEBUG] QSTASH_TOKEN starts with quote:', rawQstashToken?.startsWith('"'))
    console.log('[DEBUG] QSTASH_TOKEN ends with quote:', rawQstashToken?.endsWith('"'))
    console.log('[DEBUG] QSTASH_TOKEN contains escaped quotes:', rawQstashToken?.includes('\\"'))
    console.log('[DEBUG] QSTASH_TOKEN contains escaped newline:', rawQstashToken?.includes('\\n'))
    
    // Clean QSTASH_TOKEN immediately after retrieval
    const QSTASH_TOKEN = cleanEnvVar(rawQstashToken)
    console.log('[DEBUG] QSTASH_TOKEN after cleaning:', JSON.stringify(QSTASH_TOKEN))
    console.log('[DEBUG] QSTASH_TOKEN cleaned char codes:', Array.from(QSTASH_TOKEN).map(c => `${c}:${c.charCodeAt(0)}`).join(' '))
    console.log('[DEBUG] QSTASH_TOKEN cleaned length:', QSTASH_TOKEN.length)
    console.log('[DEBUG] QSTASH_TOKEN cleaned starts with quote:', QSTASH_TOKEN.startsWith('"'))
    console.log('[DEBUG] QSTASH_TOKEN cleaned ends with quote:', QSTASH_TOKEN.endsWith('"'))
    console.log('[DEBUG] QSTASH_TOKEN cleaned contains escaped quotes:', QSTASH_TOKEN.includes('\\"'))
    console.log('[DEBUG] QSTASH_TOKEN cleaned contains escaped newline:', QSTASH_TOKEN.includes('\\n'))

    // Debug logging for QSTASH_URL
    const rawQstashUrl = Deno.env.get('QSTASH_URL')
    console.log('[DEBUG] QSTASH_URL raw value:', JSON.stringify(rawQstashUrl))
    console.log('[DEBUG] QSTASH_URL char codes:', rawQstashUrl ? Array.from(rawQstashUrl).map(c => `${c}:${c.charCodeAt(0)}`).join(' ') : 'undefined')
    console.log('[DEBUG] QSTASH_URL length:', rawQstashUrl?.length)
    
    // Clean QSTASH_URL using the same utility function
    const cleanedQstashUrl = cleanEnvVar(rawQstashUrl) || 'https://qstash.upstash.io/v2/publish'
    console.log('[DEBUG] QSTASH_URL after cleaning:', JSON.stringify(cleanedQstashUrl))
    console.log('[DEBUG] QSTASH_URL cleaned char codes:', Array.from(cleanedQstashUrl).map(c => `${c}:${c.charCodeAt(0)}`).join(' '))
    console.log('[DEBUG] QSTASH_URL cleaned length:', cleanedQstashUrl.length)

    // TEMPORARY DEBUG: Log full QSTASH_TOKEN
    // WARNING: This is for debugging only and MUST be reverted to partial logging after testing
    console.log('[DEBUG][TEMPORARY_FULL_TOKEN_LOG] QSTASH_TOKEN from env (MUST REVERT):', QSTASH_TOKEN)

    // Debug logging
    console.log('QStash configuration:', {
      qstashUrl: cleanedQstashUrl,
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

    // Debug log FUNCTION_URL and QStash payload
    console.log('[initiate-duffel-search] FUNCTION_URL:', FUNCTION_URL);

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

    // --- QStash URL Construction Debugging ---
    // 1. Retrieve FUNCTION_URL
    const rawFunctionUrl = Deno.env.get('FUNCTION_URL');
    console.log('[initiate-duffel-search] FUNCTION_URL (raw):', JSON.stringify(rawFunctionUrl));

    // 2. Clean the URL: trim whitespace and remove surrounding quotes
    let cleanedFunctionUrl = rawFunctionUrl ? rawFunctionUrl.trim() : '';
    cleanedFunctionUrl = cleanedFunctionUrl.replace(/^['"]+|['"]+$/g, '');
    console.log('[initiate-duffel-search] FUNCTION_URL (cleaned):', JSON.stringify(cleanedFunctionUrl));

    // 3. Construct Target URL
    const targetQstashUrl = `${cleanedFunctionUrl}/process-duffel-job`;
    console.log('[initiate-duffel-search] QStash target URL:', JSON.stringify(targetQstashUrl));

    // 4. Log Character Codes
    const charCodes = Array.from(targetQstashUrl).map(c => `${c}:${c.charCodeAt(0)}`).join(' ');
    console.log('[initiate-duffel-search] QStash target URL char codes:', charCodes);

    // 5. Use Cleaned and Logged URL in Payload
    const qstashPayload = {
      url: targetQstashUrl,
      body: { job_id: job.id },
      headers: {
        'Content-Type': 'application/json',
        // Temporarily commenting out the Authorization header for testing
        // 'Authorization': `Bearer ${QSTASH_CURRENT_SIGNING_KEY}`,
      },
    };
    // 6. Log Final QStash Payload
    console.log('[initiate-duffel-search] QStash payload (FINAL DEBUG):', JSON.stringify(qstashPayload));

    // Construct and log curl command for debugging
    const curlCommand = `curl -X POST \\
      -H "Authorization: Bearer ${QSTASH_TOKEN}" \\
      -H "Content-Type: application/json" \\
      -d '${JSON.stringify(qstashPayload)}' \\
      "${cleanedQstashUrl}"`
    console.log('[DEBUG] Equivalent curl command:', curlCommand)

    let qstashRes
    try {
      qstashRes = await fetch(cleanedQstashUrl, {  // Use cleaned URL here
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${QSTASH_TOKEN}`,  // Use cleaned token here
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