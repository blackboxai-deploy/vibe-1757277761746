'use client';

import React, { useEffect, useState } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { LocationData, GeolocationService } from '@/lib/geolocation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LocationTrackerProps {
  onLocationUpdate?: (location: LocationData) => void;
  autoStart?: boolean;
}

export function LocationTracker({ onLocationUpdate, autoStart = false }: LocationTrackerProps) {
  const {
    location,
    error,
    loading,
    permission,
    isSupported,
    isWatching,
    getCurrentPosition,
    startWatching,
    stopWatching,
    clearError,
    requestPermission
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 5000,
    watchPosition: autoStart
  });

  const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);

  // Save location to history when updated
  useEffect(() => {
    if (location) {
      setLocationHistory(prev => {
        const newHistory = [...prev, location];
        // Keep only last 100 locations to prevent memory issues
        return newHistory.slice(-100);
      });
      
      // Save to localStorage
      const savedLocations = JSON.parse(localStorage.getItem('locationHistory') || '[]');
      const updatedLocations = [...savedLocations, location].slice(-100);
      localStorage.setItem('locationHistory', JSON.stringify(updatedLocations));
      
      // Call parent callback
      onLocationUpdate?.(location);
    }
  }, [location, onLocationUpdate]);

  // Load saved locations on mount
  useEffect(() => {
    const saved = localStorage.getItem('locationHistory');
    if (saved) {
      try {
        const parsedLocations = JSON.parse(saved);
        setLocationHistory(parsedLocations);
      } catch (e) {
        console.warn('Failed to parse saved locations');
      }
    }
  }, []);

  const handleGetLocation = async () => {
    clearError();
    await getCurrentPosition();
  };

  const handleStartTracking = () => {
    clearError();
    startWatching();
  };

  const handleStopTracking = () => {
    stopWatching();
  };

  const handleRequestPermission = async () => {
    await requestPermission();
  };

  const copyCoordinates = () => {
    if (location) {
      const coords = GeolocationService.formatCoordinates(location.latitude, location.longitude);
      navigator.clipboard.writeText(coords);
      // You could add a toast notification here
    }
  };

  const getAccuracyBadgeColor = (accuracy: number): string => {
    const level = GeolocationService.getAccuracyLevel(accuracy);
    switch (level) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isSupported) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <Alert>
            <AlertDescription>
              Geolocation is not supported by your browser. Please use a modern browser with location services enabled.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Location Tracker
          <div className="flex items-center space-x-2">
            {isWatching && (
              <Badge className="bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Tracking
              </Badge>
            )}
            {permission && (
              <Badge variant={permission === 'granted' ? 'default' : 'destructive'}>
                {permission}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error Display */}
        {error && (
          <Alert>
            <AlertDescription>
              {error.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Permission Request */}
        {permission === 'denied' && (
          <Alert>
            <AlertDescription className="flex justify-between items-center">
              <span>Location permission is required to track your position.</span>
              <Button onClick={handleRequestPermission} size="sm">
                Request Permission
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleGetLocation}
            disabled={loading || permission === 'denied'}
            className="flex-1 min-w-[120px]"
          >
            {loading ? 'Getting Location...' : 'Get Current Location'}
          </Button>
          
          {!isWatching ? (
            <Button
              onClick={handleStartTracking}
              disabled={loading || permission === 'denied'}
              variant="outline"
              className="flex-1 min-w-[120px]"
            >
              Start Tracking
            </Button>
          ) : (
            <Button
              onClick={handleStopTracking}
              variant="destructive"
              className="flex-1 min-w-[120px]"
            >
              Stop Tracking
            </Button>
          )}
        </div>

        {/* Location Information */}
        {location && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-lg">Current Location</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Latitude</label>
                <p className="text-lg font-mono">{location.latitude.toFixed(6)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Longitude</label>
                <p className="text-lg font-mono">{location.longitude.toFixed(6)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Accuracy</label>
                <div className="flex items-center space-x-2">
                  <p className="text-lg font-mono">{location.accuracy.toFixed(0)}m</p>
                  <Badge className={getAccuracyBadgeColor(location.accuracy)}>
                    {GeolocationService.getAccuracyLevel(location.accuracy)}
                  </Badge>
                </div>
              </div>
              
              {location.altitude && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Altitude</label>
                  <p className="text-lg font-mono">{location.altitude.toFixed(0)}m</p>
                </div>
              )}
              
              {location.speed !== null && location.speed !== undefined && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Speed</label>
                  <p className="text-lg font-mono">{(location.speed * 3.6).toFixed(1)} km/h</p>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Timestamp</label>
              <p className="text-sm text-gray-500">{new Date(location.timestamp).toLocaleString()}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={copyCoordinates} size="sm" variant="outline">
                Copy Coordinates
              </Button>
              <Button 
                onClick={() => window.open(`https://maps.google.com/?q=${location.latitude},${location.longitude}`, '_blank')}
                size="sm" 
                variant="outline"
              >
                View on Google Maps
              </Button>
            </div>
          </div>
        )}

        {/* Location History Summary */}
        {locationHistory.length > 0 && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Tracking Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{locationHistory.length}</p>
                <p className="text-sm text-gray-600">Locations</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {((Date.now() - locationHistory[0]?.timestamp) / (1000 * 60 * 60)).toFixed(1)}
                </p>
                <p className="text-sm text-gray-600">Hours</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {locationHistory.length > 1 
                    ? GeolocationService.calculateDistance(
                        locationHistory[0].latitude,
                        locationHistory[0].longitude,
                        locationHistory[locationHistory.length - 1].latitude,
                        locationHistory[locationHistory.length - 1].longitude
                      ).toFixed(2)
                    : '0.00'
                  }
                </p>
                <p className="text-sm text-gray-600">km Distance</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(locationHistory.reduce((sum, loc) => sum + loc.accuracy, 0) / locationHistory.length) || 0}m
                </p>
                <p className="text-sm text-gray-600">Avg Accuracy</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}