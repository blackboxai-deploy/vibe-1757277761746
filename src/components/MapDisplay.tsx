'use client';

import React, { useState, useEffect } from 'react';
import { LocationData } from '@/lib/geolocation';
import { MapUtils } from '@/lib/mapUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MapDisplayProps {
  location: LocationData | null;
  locationHistory: LocationData[];
  className?: string;
}

export function MapDisplay({ location, locationHistory, className = '' }: MapDisplayProps) {
  const [mapSize, setMapSize] = useState('800x600');
  const [mapType, setMapType] = useState<'current' | 'history'>('current');

  useEffect(() => {
    // Adjust map size based on screen size
    const updateMapSize = () => {
      if (typeof window !== 'undefined') {
        const width = window.innerWidth;
        if (width < 768) {
          setMapSize('400x300');
        } else if (width < 1024) {
          setMapSize('600x400');
        } else {
          setMapSize('800x600');
        }
      }
    };

    updateMapSize();
    window.addEventListener('resize', updateMapSize);
    return () => window.removeEventListener('resize', updateMapSize);
  }, []);

  const currentMapUrl = location 
    ? MapUtils.generateMapUrl(
        location.latitude, 
        location.longitude, 
        MapUtils.getOptimalZoom(location.accuracy), 
        mapSize
      )
    : `https://placehold.co/${mapSize}?text=No+Location+Available%0AEnable+location+services+to+view+map`;

  const historyMapUrl = locationHistory.length > 0
    ? MapUtils.generateStaticMapWithMarkers(locationHistory, mapSize)
    : `https://placehold.co/${mapSize}?text=No+Location+History%0AStart+tracking+to+view+path`;

  const openInMaps = (service: 'google' | 'apple') => {
    if (!location) return;
    
    const url = service === 'google' 
      ? MapUtils.generateGoogleMapsLink(location.latitude, location.longitude)
      : MapUtils.generateAppleMapsLink(location.latitude, location.longitude);
    
    window.open(url, '_blank');
  };

  const shareLocation = () => {
    if (!location) return;
    
    const shareUrl = MapUtils.generateShareableLocationUrl(location.latitude, location.longitude);
    
    if (navigator.share) {
      navigator.share({
        title: 'My Current Location',
        text: `Check out my location: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      // You could add a toast notification here
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between flex-wrap gap-2">
          <span>Interactive Map</span>
          <div className="flex items-center space-x-2">
            {location && (
              <Badge className="bg-blue-100 text-blue-800">
                Zoom: {MapUtils.getOptimalZoom(location.accuracy)}
              </Badge>
            )}
            <div className="flex rounded-lg border">
              <Button
                variant={mapType === 'current' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMapType('current')}
                className="rounded-r-none"
              >
                Current
              </Button>
              <Button
                variant={mapType === 'history' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMapType('history')}
                className="rounded-l-none"
                disabled={locationHistory.length === 0}
              >
                History
              </Button>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Map Image */}
        <div className="relative overflow-hidden rounded-lg border bg-gray-100">
          <img
            src={mapType === 'current' ? currentMapUrl : historyMapUrl}
            alt={mapType === 'current' ? 'Current location map' : 'Location history map'}
            className="w-full h-auto object-cover"
            style={{ aspectRatio: '4/3' }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://placehold.co/${mapSize}?text=Map+Loading+Error%0APlease+try+again`;
            }}
          />
          
          {/* Map Overlay Info */}
          {location && mapType === 'current' && (
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm">
              <div className="text-sm font-medium">Current Position</div>
              <div className="text-xs text-gray-600 font-mono">
                {MapUtils.getLocationDescription(location.latitude, location.longitude)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Accuracy: {location.accuracy.toFixed(0)}m
              </div>
            </div>
          )}
          
          {mapType === 'history' && locationHistory.length > 0 && (
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm">
              <div className="text-sm font-medium">Location Trail</div>
              <div className="text-xs text-gray-600">
                {locationHistory.length} tracked points
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {((Date.now() - locationHistory[0]?.timestamp) / (1000 * 60 * 60)).toFixed(1)} hours
              </div>
            </div>
          )}
        </div>

        {/* Map Controls */}
        {location && (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => openInMaps('google')}
              size="sm"
              variant="outline"
              className="flex-1 min-w-[120px]"
            >
              Open in Google Maps
            </Button>
            <Button
              onClick={() => openInMaps('apple')}
              size="sm"
              variant="outline"
              className="flex-1 min-w-[120px]"
            >
              Open in Apple Maps
            </Button>
            <Button
              onClick={shareLocation}
              size="sm"
              variant="outline"
              className="flex-1 min-w-[120px]"
            >
              Share Location
            </Button>
          </div>
        )}

        {/* Location Details */}
        {location && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-700">Coordinate Formats</h4>
              <div className="mt-2 space-y-1">
                <div className="text-sm">
                  <span className="text-gray-600">Decimal:</span>
                  <span className="ml-2 font-mono">{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">DMS:</span>
                  <span className="ml-2 font-mono text-xs">
                    {MapUtils.formatDegreeMinuteSecond(location.latitude)}, {MapUtils.formatDegreeMinuteSecond(location.longitude)}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700">Location Info</h4>
              <div className="mt-2 space-y-1">
                <div className="text-sm">
                  <span className="text-gray-600">Timezone:</span>
                  <span className="ml-2">{MapUtils.getTimezoneOffset(location.latitude, location.longitude)}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Updated:</span>
                  <span className="ml-2">{new Date(location.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Statistics */}
        {mapType === 'history' && locationHistory.length > 1 && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-3">Trail Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{locationHistory.length}</div>
                <div className="text-xs text-blue-700">Points</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {MapUtils.calculateBounds(locationHistory).center[0].toFixed(4)}
                </div>
                <div className="text-xs text-blue-700">Center Lat</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {MapUtils.calculateBounds(locationHistory).center[1].toFixed(4)}
                </div>
                <div className="text-xs text-blue-700">Center Lng</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {(MapUtils.calculateAreaFromLocations(locationHistory) * 1000000).toFixed(2)}
                </div>
                <div className="text-xs text-blue-700">Area (m²)</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}