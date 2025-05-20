import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Duffel } from 'https://esm.sh/@duffel/api@1.0.0'

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
    // Verify QStash signature
    const signature = req.headers.get('x-qstash-signature')
    if (!signature) {
      throw new Error('Missing QStash signature')
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const { job_id } = await req.json()
    if (!job_id) {
      throw new Error('Missing job_id')
    }

    // Get job details
    const { data: job, error: jobError } = await supabaseClient
      .from('duffel_jobs')
      .select('*')
      .eq('id', job_id)
      .single()

    if (jobError || !job) {
      throw new Error(`Job not found: ${jobError?.message}`)
    }

    // Update job status to processing
    await supabaseClient
      .from('duffel_jobs')
      .update({ status: 'processing' })
      .eq('id', job_id)

    // Initialize Duffel client
    const duffel = new Duffel({
      token: Deno.env.get('DUFFEL_TOKEN') ?? '',
    })

    // Create offer request
    const offerRequest = await duffel.offerRequests.create({
      slices: [
        {
          origin: job.search_params.origin,
          destination: job.search_params.destination,
          departure_date: job.search_params.departureDate,
          arrival_time: { from: '06:00', to: '22:00' },
          departure_time: { from: '06:00', to: '22:00' },
        },
        ...(job.search_params.returnDate
          ? [
              {
                origin: job.search_params.destination,
                destination: job.search_params.origin,
                departure_date: job.search_params.returnDate,
                arrival_time: { from: '06:00', to: '22:00' },
                departure_time: { from: '06:00', to: '22:00' },
              },
            ]
          : []),
      ],
      passengers: [
        ...Array(job.search_params.passengers.adults).fill({ type: 'adult' }),
        ...Array(job.search_params.passengers.children || 0).fill({ type: 'child' }),
        ...Array(job.search_params.passengers.infants || 0).fill({ type: 'infant' }),
      ],
      cabin_class: job.search_params.cabinClass,
    })

    // Get offers
    const offers = await duffel.offers.list({
      offer_request_id: offerRequest.data.id,
      limit: job.search_params.limit || 15,
      sort: job.search_params.sort || 'total_amount',
    })

    // Update job with results
    await supabaseClient
      .from('duffel_jobs')
      .update({
        status: 'completed',
        results_data: {
          data: offers.data,
          meta: offers.meta,
        },
      })
      .eq('id', job_id)

    return new Response(
      JSON.stringify({
        success: true,
        job_id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    // If we have a job_id, update the job status to failed
    if (error.job_id) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      await supabaseClient
        .from('duffel_jobs')
        .update({
          status: 'failed',
          error_message: error.message,
        })
        .eq('id', error.job_id)
    }

    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}) 