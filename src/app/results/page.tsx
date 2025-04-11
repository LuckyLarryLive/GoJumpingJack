'use client';
import { useSearchParams } from 'next/navigation';

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const departure = searchParams.get('departure_at');
  const returnDate = searchParams.get('return_at');

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">All Results</h1>
      <p>From: {origin}</p>
      <p>To: {destination}</p>
      <p>Departure: {departure}</p>
      {returnDate && <p>Return: {returnDate}</p>}
      {/* TODO: Fetch and render all matching flights */}
    </div>
  );
}
