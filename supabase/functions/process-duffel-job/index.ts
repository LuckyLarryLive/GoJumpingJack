import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Receiver } from 'https://esm.sh/@upstash/qstash@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, upstash-signature, upstash-timestamp',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Log all incoming headers for debugging
    console.log('[process-duffel-job] All incoming headers:');
    for (const [key, value] of req.headers.entries()) {
      console.log(`${key}: ${value}`);
    }

    // Get QStash signature and timestamp - try both lowercase and original case
    const signature = req.headers.get('upstash-signature') || req.headers.get('Upstash-Signature');
    let timestamp = req.headers.get('upstash-timestamp') || req.headers.get('Upstash-Timestamp');
    
    // If timestamp is missing, use current time as fallback
    if (!timestamp) {
      timestamp = Math.floor(Date.now() / 1000).toString();
      console.log('[process-duffel-job] Using current timestamp as fallback:', timestamp);
    }
    
    // Log the specific headers we're looking for
    console.log('[process-duffel-job] QStash verification headers:', {
      signature,
      timestamp,
      signatureHeaderExists: req.headers.has('upstash-signature') || req.headers.has('Upstash-Signature'),
      timestampHeaderExists: req.headers.has('upstash-timestamp') || req.headers.has('Upstash-Timestamp'),
      currentSigningKey: Deno.env.get('QSTASH_CURRENT_SIGNING_KEY') ? 'SET' : 'NOT SET',
      nextSigningKey: Deno.env.get('QSTASH_NEXT_SIGNING_KEY') ? 'SET' : 'NOT SET',
    });
    
    if (!signature) {
      throw new Error('Missing QStash signature');
    }

    // Get the raw body for signature verification
    const rawBody = await req.text();
    
    // Get signing keys
    const currentSigningKey = Deno.env.get('QSTASH_CURRENT_SIGNING_KEY');
    const nextSigningKey = Deno.env.get('QSTASH_NEXT_SIGNING_KEY');
    
    if (!currentSigningKey && !nextSigningKey) {
      throw new Error('Missing QStash signing keys');
    }

    // Create QStash receiver and verify signature
    const receiver = new Receiver({
      currentSigningKey,
      nextSigningKey,
    });

    const isValid = await receiver.verify({
      signature,
      timestamp,
      body: rawBody,
    });

    if (!isValid) {
      throw new Error('Invalid QStash signature');
    }

    // Parse the verified body
    const { job_id } = JSON.parse(rawBody);
    if (!job_id) {
      throw new Error('Missing job_id');
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

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

    // Get Duffel token based on mode
    const duffelMode = Deno.env.get('DUFFEL_MODE');
    const duffelTestToken = Deno.env.get('DUFFEL_TEST_TOKEN');
    const duffelLiveToken = Deno.env.get('DUFFEL_LIVE_TOKEN');
    
    let duffelToken: string | undefined;
    if (duffelMode === 'live') {
      duffelToken = duffelLiveToken;
    } else if (duffelMode === 'test') {
      duffelToken = duffelTestToken;
    }

    // Log token configuration
    console.log('[process-duffel-job] Duffel token configuration:', {
      mode: duffelMode,
      testTokenSet: duffelTestToken ? 'SET' : 'NOT SET',
      liveTokenSet: duffelLiveToken ? 'SET' : 'NOT SET',
      selectedTokenSet: duffelToken ? 'SET' : 'NOT SET',
    });

    if (!duffelToken) {
      throw new Error(`DUFFEL_TOKEN not set for mode: ${duffelMode}. Please ensure DUFFEL_MODE is set to 'test' or 'live' and the corresponding token is set.`);
    }

    // Prepare offer request body
    const offerRequestBody = {
      data: {
        cabin_class: job.search_params.cabinClass,
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
      }
    };

    console.log('[process-duffel-job] Making direct fetch to Duffel. Offer request body:', JSON.stringify(offerRequestBody));
    console.log(`[process-duffel-job] Using Duffel Token (type): ${typeof duffelToken}, Mode: ${duffelMode}`);

    try {
      // Create offer request
      const offerRequestResponse = await fetch('https://api.duffel.com/air/offer_requests', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${duffelToken}`,
          'Duffel-Version': 'v2',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip'
        },
        body: JSON.stringify(offerRequestBody)
      });

      const responseBodyText = await offerRequestResponse.text();
      console.log(`[process-duffel-job] Duffel API status: ${offerRequestResponse.status}`);
      console.log('[process-duffel-job] Duffel API response body (raw):', responseBodyText);

      if (!offerRequestResponse.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseBodyText);
        } catch (e) {
          errorData = { message: "Failed to parse Duffel error response", raw: responseBodyText };
        }
        console.error('[process-duffel-job] Duffel API Error:', JSON.stringify(errorData));
        
        // Update job status to failed
        await supabaseClient
          .from('duffel_jobs')
          .update({
            status: 'failed',
            error_message: JSON.stringify(errorData)
          })
          .eq('id', job_id);

        return new Response(
          JSON.stringify({ error: "Duffel API error", details: errorData }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 // Return 200 since we've handled the error
          }
        );
      }

      const offerRequestData = JSON.parse(responseBodyText);
      console.log('[process-duffel-job] Offer request created successfully');

      // Get offers using the offer request ID
      const offersResponse = await fetch(`https://api.duffel.com/air/offers?offer_request_id=${offerRequestData.data.id}&limit=${job.search_params.limit || 15}&sort=${job.search_params.sort || 'total_amount'}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${duffelToken}`,
          'Duffel-Version': 'v2',
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip'
        }
      });

      const offersBodyText = await offersResponse.text();
      console.log(`[process-duffel-job] Duffel Offers API status: ${offersResponse.status}`);

      if (!offersResponse.ok) {
        let errorData;
        try {
          errorData = JSON.parse(offersBodyText);
        } catch (e) {
          errorData = { message: "Failed to parse Duffel error response", raw: offersBodyText };
        }
        console.error('[process-duffel-job] Duffel Offers API Error:', JSON.stringify(errorData));
        
        // Update job status to failed
        await supabaseClient
          .from('duffel_jobs')
          .update({
            status: 'failed',
            error_message: JSON.stringify(errorData)
          })
          .eq('id', job_id);

        return new Response(
          JSON.stringify({ error: "Duffel Offers API error", details: errorData }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 // Return 200 since we've handled the error
          }
        );
      }

      const offersData = JSON.parse(offersBodyText);
      console.log('[process-duffel-job] Offers retrieved successfully');
      console.log('[process-duffel-job] Offers data structure:', {
        hasData: !!offersData.data,
        dataLength: offersData.data?.length,
        hasMeta: !!offersData.meta,
        metaKeys: offersData.meta ? Object.keys(offersData.meta) : [],
        firstOfferSample: offersData.data?.[0] ? {
          id: offersData.data[0].id,
          total_amount: offersData.data[0].total_amount,
          total_currency: offersData.data[0].total_currency,
          slices: offersData.data[0].slices?.length
        } : null
      });

      // Update job with results
      const updateData = {
        status: 'completed',
        results_data: {
          data: offersData.data || [],
          meta: offersData.meta || {}
        }
      };
      
      console.log('[process-duffel-job] Updating job with data:', {
        jobId: job_id,
        status: updateData.status,
        hasResultsData: !!updateData.results_data,
        resultsDataKeys: Object.keys(updateData.results_data),
        resultsDataStructure: {
          hasData: !!updateData.results_data.data,
          dataLength: updateData.results_data.data?.length,
          hasMeta: !!updateData.results_data.meta,
          metaKeys: updateData.results_data.meta ? Object.keys(updateData.results_data.meta) : []
        }
      });

      const { error: updateError } = await supabaseClient
        .from('duffel_jobs')
        .update(updateData)
        .eq('id', job_id);

      if (updateError) {
        console.error('[process-duffel-job] Error updating job:', updateError);
        throw new Error(`Failed to update job: ${updateError.message}`);
      }

      // Verify the update was successful
      const { data: updatedJob, error: verifyError } = await supabaseClient
        .from('duffel_jobs')
        .select('*')
        .eq('id', job_id)
        .single();

      if (verifyError) {
        console.error('[process-duffel-job] Error verifying job update:', verifyError);
      } else {
        console.log('[process-duffel-job] Job update verified:', {
          jobId: updatedJob.id,
          status: updatedJob.status,
          hasResultsData: !!updatedJob.results_data,
          resultsDataKeys: updatedJob.results_data ? Object.keys(updatedJob.results_data) : [],
          resultsDataStructure: updatedJob.results_data ? {
            hasData: !!updatedJob.results_data.data,
            dataLength: updatedJob.results_data.data?.length,
            hasMeta: !!updatedJob.results_data.meta,
            metaKeys: updatedJob.results_data.meta ? Object.keys(updatedJob.results_data.meta) : []
          } : null
        });
      }

      console.log('[process-duffel-job] Job updated successfully');

      return new Response(
        JSON.stringify({
          success: true,
          job_id,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } catch (error) {
      console.error('[process-duffel-job] Error calling Duffel API:', error);
      
      // Update job status to failed
      await supabaseClient
        .from('duffel_jobs')
        .update({
          status: 'failed',
          error_message: error.message
        })
        .eq('id', job_id);

      return new Response(
        JSON.stringify({ error: "Failed to call Duffel API", details: error.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 // Return 200 since we've handled the error
        }
      );
    }
  } catch (error) {
    console.error('[process-duffel-job] Error:', error);

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