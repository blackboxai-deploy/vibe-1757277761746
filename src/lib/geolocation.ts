export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export class GeolocationService {
  private watchId: number | null = null;
  private lastKnownPosition: LocationData | null = null;

  static isGeolocationSupported(): boolean {
    return 'geolocation' in navigator;
  }

  static async checkPermission(): Promise<PermissionState> {
    if (!('permissions' in navigator)) {
      return 'prompt';
    }
    
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state;
    } catch (error) {
      return 'prompt';
    }
  }

  static getCurrentPosition(
    options: GeolocationOptions = {}
  ): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!GeolocationService.isGeolocationSupported()) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const defaultOptions: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
        ...options,
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            altitude: position.coords.altitude || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
          };
          resolve(locationData);
        },
        (error) => {
          reject({
            code: error.code,
            message: GeolocationService.getErrorMessage(error.code),
          });
        },
        defaultOptions
      );
    });
  }

  startWatching(
    onLocationUpdate: (location: LocationData) => void,
    onError: (error: GeolocationError) => void,
    options: GeolocationOptions = {}
  ): void {
    if (!GeolocationService.isGeolocationSupported()) {
      onError({
        code: 0,
        message: 'Geolocation is not supported by this browser',
      });
      return;
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
      ...options,
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          altitude: position.coords.altitude || undefined,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
        };
        
        this.lastKnownPosition = locationData;
        onLocationUpdate(locationData);
      },
      (error) => {
        onError({
          code: error.code,
          message: GeolocationService.getErrorMessage(error.code),
        });
      },
      defaultOptions
    );
  }

  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  getLastKnownPosition(): LocationData | null {
    return this.lastKnownPosition;
  }

  static getErrorMessage(errorCode: number): string {
    switch (errorCode) {
      case 1:
        return 'Location access denied by user. Please enable location permissions to use this feature.';
      case 2:
        return 'Location information unavailable. Please check your device settings and internet connection.';
      case 3:
        return 'Location request timed out. Please try again.';
      default:
        return 'An unknown error occurred while retrieving location.';
    }
  }

  static formatCoordinates(
    latitude: number,
    longitude: number,
    precision: number = 6
  ): string {
    return `${latitude.toFixed(precision)}, ${longitude.toFixed(precision)}`;
  }

  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  static getAccuracyLevel(accuracy: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (accuracy <= 10) return 'excellent';
    if (accuracy <= 50) return 'good';
    if (accuracy <= 100) return 'fair';
    return 'poor';
  }

  static getAccuracyColor(accuracy: number): string {
    const level = this.getAccuracyLevel(accuracy);
    switch (level) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
    }
  }
}