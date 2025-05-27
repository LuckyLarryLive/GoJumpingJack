$body = @{
    searchParams = @{
        origin = 'LHR'
        destination = 'JFK'
        departureDate = '2024-06-01'
        passengers = @{
            adults = 1
        }
    }
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Uri 'https://duizhnlioieuatcdyzii.functions.supabase.co/initiate-duffel-search' `
    -Method Post `
    -ContentType 'application/json' `
    -Body $body

$response | ConvertTo-Json 