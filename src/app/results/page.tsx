'use client';
import { Suspense } from 'react';
import ResultsContent from './ResultsContent';

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading results...</div>}>
      <ResultsContent />
    </Suspense>
  );
}
