'use client';

import { useState, useEffect } from 'react';

interface BackgroundSectionProps {
  destinationCityNameForApi?: string;
  destinationCountryCodeForApi?: string;
}

export default function BackgroundSection({ 
  destinationCityNameForApi, 
  destinationCountryCodeForApi 
}: BackgroundSectionProps) {
  const [backgroundImage, setBackgroundImage] = useState('/default_background.png');
  const [attribution, setAttribution] = useState<{
    name: string;
    profileUrl: string;
    unsplashUrl: string;
  } | null>(null);
  const [isFading, setIsFading] = useState(false);

  // Update the useEffect for fetching Unsplash image
  useEffect(() => {
    // The value of backgroundImage at the time this effect is triggered.
    const currentImageOnEffectTrigger = backgroundImage;

    if (destinationCityNameForApi && destinationCountryCodeForApi) {
      console.log('[BackgroundSection] useEffect Unsplash: Checking for image update for', {
        destinationCityNameForApi,
        destinationCountryCodeForApi,
        currentImageOnEffectTrigger,
      });

      let imageWillActuallyChange = false;

      fetch(
        `/api/get-unsplash-image?city=${encodeURIComponent(
          destinationCityNameForApi
        )}&country=${encodeURIComponent(destinationCountryCodeForApi)}`
      )
        .then(res => res.json())
        .then(data => {
          const newImageUrl = data.imageUrl || '/default_background.png';
          const newAttribution = data.imageUrl
            ? {
                name: data.photographerName,
                profileUrl: data.photographerProfileUrl,
                unsplashUrl: data.unsplashUrl,
              }
            : null;

          if (newImageUrl !== currentImageOnEffectTrigger) {
            console.log(
              `[BackgroundSection] Image will change from ${currentImageOnEffectTrigger} to ${newImageUrl}. Initiating fade.`
            );
            imageWillActuallyChange = true;
            setIsFading(true); // Start fade-out of the current backgroundImage

            // Set the new image and attribution. This happens while opacity is 0 (or transitioning to 0).
            setBackgroundImage(newImageUrl);
            setAttribution(newAttribution);
          } else {
            console.log(
              `[BackgroundSection] Image is the same (${newImageUrl}). No change needed.`
            );
            if (isFading) setIsFading(false);
          }

          // If the image changed, we need to fade back in after a short delay
          if (imageWillActuallyChange) {
            setTimeout(() => setIsFading(false), 50); // Fade back in
          }
        })
        .catch(err => {
          console.error('[BackgroundSection] Error fetching Unsplash image:', err);
          // If an error occurs, revert to default background if not already default
          if (currentImageOnEffectTrigger !== '/default_background.png') {
            imageWillActuallyChange = true;
            setIsFading(true);
            setBackgroundImage('/default_background.png');
            setAttribution(null);
          } else {
            if (isFading) setIsFading(false);
          }

          if (imageWillActuallyChange) {
            setTimeout(() => setIsFading(false), 50);
          }
        });
    } else {
      // No destination selected, ensure default background is set if not already.
      if (currentImageOnEffectTrigger !== '/default_background.png') {
        console.log('[BackgroundSection] No destination, changing to default background.');
        setIsFading(true);
        setBackgroundImage('/default_background.png');
        setAttribution(null);
        // The setIsFading(false) will make the default image appear with a fade.
        // This needs to be handled carefully if isFading can be triggered by other means.
        // For simplicity, we assume this effect is the main driver of background and fading.
        // The subsequent setIsFading(false) ensures the default background becomes visible.
        setTimeout(() => setIsFading(false), 50); // Small delay to ensure fade-out starts, then fade-in default.
      } else {
        if (isFading) setIsFading(false); // Was already default, ensure not fading.
      }
    }
  }, [destinationCityNameForApi, destinationCountryCodeForApi, backgroundImage, isFading]);

  return (
    <section
      className="py-8 bg-gray-50 flex items-center justify-center"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transition: 'opacity 1.75s ease-in-out',
        opacity: isFading ? 0 : 1,
        minHeight: '200px',
      }}
    >
      <div className="container mx-auto px-2 sm:px-4">
        <div className="text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-4" style={{ textShadow: '2px 2px 8px rgba(0, 0, 0, 0.8)' }}>
            Find Your Perfect Flight
          </h1>
          <p className="text-xl md:text-2xl mb-8" style={{ textShadow: '2px 2px 6px rgba(0, 0, 0, 0.8)' }}>
            Discover amazing destinations at unbeatable prices
          </p>
        </div>
      </div>
      
      {/* Attribution */}
      {attribution && (
        <div className="absolute bottom-4 right-4 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
          Photo by{' '}
          <a
            href={attribution.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-300"
          >
            {attribution.name}
          </a>{' '}
          on{' '}
          <a
            href={attribution.unsplashUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-300"
          >
            Unsplash
          </a>
        </div>
      )}
    </section>
  );
}
