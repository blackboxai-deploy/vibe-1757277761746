'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GeolocationService, LocationData, GeolocationError } from '@/lib/geolocation';

interface UseGeolocationState {
  location: LocationData | null;
  error: GeolocationError | null;
  loading: boolean;
  permission: PermissionState | null;
  isSupported: boolean;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const [state, setState] = useState<UseGeolocationState>({
    location: null,
    error: null,
    loading: false,
    permission: null,
    isSupported: GeolocationService.isGeolocationSupported(),
  });

  const geolocationService = useRef<GeolocationService>(new GeolocationService());
  const isWatching = useRef(false);

  const updateState = useCallback((updates: Partial<UseGeolocationState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const checkPermission = useCallback(async () => {
    try {
      const permission = await GeolocationService.checkPermission();
      updateState({ permission });
      return permission;
    } catch (error) {
      updateState({ 
        permission: 'denied',
        error: { code: 1, message: 'Failed to check location permission' }
      });
      return 'denied' as PermissionState;
    }
  }, [updateState]);

  const getCurrentPosition = useCallback(async () => {
    if (!state.isSupported) {
      updateState({
        error: { code: 0, message: 'Geolocation is not supported by this browser' }
      });
      return null;
    }

    updateState({ loading: true, error: null });

    try {
      const location = await GeolocationService.getCurrentPosition(options);
      updateState({ location, loading: false });
      return location;
    } catch (error) {
      updateState({ 
        error: error as GeolocationError, 
        loading: false 
      });
      return null;
    }
  }, [state.isSupported, options, updateState]);

  const startWatching = useCallback(() => {
    if (!state.isSupported || isWatching.current) {
      return;
    }

    updateState({ loading: true, error: null });

    geolocationService.current.startWatching(
      (location: LocationData) => {
        updateState({ location, loading: false });
      },
      (error: GeolocationError) => {
        updateState({ error, loading: false });
      },
      options
    );

    isWatching.current = true;
  }, [state.isSupported, options, updateState]);

  const stopWatching = useCallback(() => {
    if (isWatching.current) {
      geolocationService.current.stopWatching();
      isWatching.current = false;
      updateState({ loading: false });
    }
  }, [updateState]);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const requestPermission = useCallback(async () => {
    // Trigger permission request by attempting to get location
    await getCurrentPosition();
  }, [getCurrentPosition]);

  // Initialize permission check on mount
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  // Auto-start watching if enabled
  useEffect(() => {
    if (options.watchPosition && state.permission === 'granted') {
      startWatching();
    }

    return () => {
      if (isWatching.current) {
        stopWatching();
      }
    };
  }, [options.watchPosition, state.permission, startWatching, stopWatching]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isWatching.current) {
        geolocationService.current.stopWatching();
      }
    };
  }, []);

  return {
    // State
    location: state.location,
    error: state.error,
    loading: state.loading,
    permission: state.permission,
    isSupported: state.isSupported,
    isWatching: isWatching.current,
    
    // Actions
    getCurrentPosition,
    startWatching,
    stopWatching,
    clearError,
    requestPermission,
    checkPermission,
    
    // Derived data
    hasLocation: !!state.location,
    accuracy: state.location?.accuracy,
    coordinates: state.location ? {
      latitude: state.location.latitude,
      longitude: state.location.longitude
    } : null,
    
    // Helper methods
    formatCoordinates: state.location 
      ? () => GeolocationService.formatCoordinates(state.location!.latitude, state.location!.longitude)
      : () => null,
    
    getLastKnownPosition: () => geolocationService.current.getLastKnownPosition(),
  };
}