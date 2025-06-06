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
  
  // Convert to array of characters to inspect each one
  const chars = Array.from(value);
  console.log('[DEBUG] cleanEnvVar input chars:', chars.map(c => `${c}:${c.charCodeAt(0)}`).join(' '));
  
  // Filter out unwanted characters
  const cleanedChars = chars.filter(c => {
    const code = c.charCodeAt(0);
    // Keep only printable ASCII characters (32-126) except quotes and backslashes
    return code >= 32 && code <= 126 && c !== '"' && c !== "'" && c !== '\\';
  });
  
  console.log('[DEBUG] cleanEnvVar filtered chars:', cleanedChars.map(c => `${c}:${c.charCodeAt(0)}`).join(' '));
  
  // Join back to string
  const cleaned = cleanedChars.join('');
  console.log('[DEBUG] cleanEnvVar result:', JSON.stringify(cleaned));
  
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
    
    // Direct token cleaning with precise logging
    const rawQstashToken = Deno.env.get('QSTASH_TOKEN') ?? ''
    console.log(`[DEBUG] QSTASH_TOKEN RAW (length ${rawQstashToken.length}): '${rawQstashToken}'`)
    console.log(`[DEBUG] QSTASH_TOKEN RAW (JSON.stringified): ${JSON.stringify(rawQstashToken)}`)
    console.log('[DEBUG] QSTASH_TOKEN RAW char codes:', Array.from(rawQstashToken).map(c => `${c}:${c.charCodeAt(0)}`).join(' '))

    // Direct trim of the token
    const cleanedQstashToken = rawQstashToken.trim()
    console.log(`[DEBUG] QSTASH_TOKEN CLEANED (length ${cleanedQstashToken.length}): '${cleanedQstashToken}'`)
    console.log(`[DEBUG] QSTASH_TOKEN CLEANED (JSON.stringified): ${JSON.stringify(cleanedQstashToken)}`)
    console.log('[DEBUG] QSTASH_TOKEN CLEANED char codes:', Array.from(cleanedQstashToken).map(c => `${c}:${c.charCodeAt(0)}`).join(' '))

    const FUNCTION_URL = cleanEnvVar(Deno.env.get('FUNCTION_URL'))
    const QSTASH_CURRENT_SIGNING_KEY = cleanEnvVar(Deno.env.get('QSTASH_CURRENT_SIGNING_KEY'))

    // Debug logging
    console.log('QStash configuration:', {
      qstashUrl: QSTASH_URL,
      functionUrl: FUNCTION_URL,
      hasToken: !!cleanedQstashToken,
      hasSigningKey: !!QSTASH_CURRENT_SIGNING_KEY
    })

    if (!cleanedQstashToken || !FUNCTION_URL || !QSTASH_CURRENT_SIGNING_KEY) {
      console.error('[initiate-duffel-search] Missing QStash env vars', {
        hasToken: !!cleanedQstashToken,
        hasFunctionUrl: !!FUNCTION_URL,
        hasSigningKey: !!QSTASH_CURRENT_SIGNING_KEY
      })
      return new Response(JSON.stringify({ error: 'Missing QStash environment variables' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    // Extra debug: Log the QStash token (first 6 and last 4 chars for security)
    console.log('[initiate-duffel-search] QStash token (partial):', cleanedQstashToken ? cleanedQstashToken.slice(0,6) + '...' + cleanedQstashToken.slice(-4) : 'undefined');

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
    // 1. Retrieve and clean FUNCTION_URL
    const rawFunctionUrl = Deno.env.get('FUNCTION_URL');
    let cleanedFunctionUrl = rawFunctionUrl ? rawFunctionUrl.trim() : '';
    cleanedFunctionUrl = cleanedFunctionUrl.replace(/^['"]+|['"]+$/g, '');

    // 2. Ensure URL has https:// scheme
    if (!cleanedFunctionUrl.startsWith('http://') && !cleanedFunctionUrl.startsWith('https://')) {
      cleanedFunctionUrl = `https://${cleanedFunctionUrl}`;
    }
    console.log('[DEBUG] FUNCTION_URL (final):', JSON.stringify(cleanedFunctionUrl));

    // 3. Construct Target URL
    const targetQstashUrl = `${cleanedFunctionUrl}/process-duffel-job`;
    console.log('[DEBUG] QStash target URL:', JSON.stringify(targetQstashUrl));

    // 4. Construct QStash Publish URL with target in path
    const qstashPublishUrl = `https://qstash.upstash.io/v2/publish/${targetQstashUrl}`;
    console.log('[DEBUG] QStash publish URL:', JSON.stringify(qstashPublishUrl));

    // 5. Prepare simplified forward body
    const qstashForwardBody = JSON.stringify({ job_id: job.id });
    console.log('[DEBUG] QStash forward body:', qstashForwardBody);

    let qstashRes
    try {
      // Log the service role key (first 6 and last 4 chars for security)
      console.log('[DEBUG] SUPABASE_SERVICE_ROLE_KEY (partial):', supabaseServiceRoleKey ? `${supabaseServiceRoleKey.slice(0,6)}...${supabaseServiceRoleKey.slice(-4)}` : 'undefined');

      // Prepare QStash headers with forwarding headers
      const qstashHeaders = {
        'Authorization': `Bearer ${cleanedQstashToken}`,
        'Content-Type': 'application/json',
        // Forward both apikey and Authorization headers to ensure compatibility
        'Upstash-Forward-apikey': supabaseServiceRoleKey,
        'Upstash-Forward-Authorization': `Bearer ${supabaseServiceRoleKey}`,
      };

      console.log('[DEBUG] QStash request headers:', {
        ...qstashHeaders,
        'Authorization': 'Bearer [REDACTED]',
        'Upstash-Forward-apikey': '[REDACTED]',
        'Upstash-Forward-Authorization': 'Bearer [REDACTED]',
      });

      console.log('[DEBUG] Making QStash request to:', qstashPublishUrl)

      qstashRes = await fetch(qstashPublishUrl, {
        method: 'POST',
        headers: qstashHeaders,
        body: qstashForwardBody,
      })

      if (!qstashRes.ok) {
        const errorText = await qstashRes.text()
        console.error('[ERROR] QStash error:', errorText)
        return new Response(JSON.stringify({ error: `Failed to publish to QStash: ${errorText}` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 502,
        })
      }

      // Log successful QStash response
      console.log('[DEBUG] QStash response status:', qstashRes.status);
      const qstashResponseText = await qstashRes.text();
      console.log('[DEBUG] QStash response body:', qstashResponseText);

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
    } catch (err) {
      console.error('[initiate-duffel-search] QStash fetch error:', err)
      return new Response(JSON.stringify({ error: 'Failed to reach QStash' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 502,
      })
    }
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