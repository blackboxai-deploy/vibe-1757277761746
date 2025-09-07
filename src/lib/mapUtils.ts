import { LocationData } from './geolocation';

export interface MapConfig {
  zoom: number;
  center: [number, number];
  markers: MapMarker[];
}

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  type: 'current' | 'history' | 'shared';
}

export class MapUtils {
  static generateMapUrl(
    latitude: number,
    longitude: number,
    zoom: number = 15,
    size: string = '600x400'
  ): string {
    // Using a simple map URL generator - in production, you'd use a proper map service
    return `https://placehold.co/${size}?text=Map+View%0A${latitude.toFixed(4)},+${longitude.toFixed(4)}%0AZoom:+${zoom}`;
  }

  static generateStaticMapWithMarkers(
    locations: LocationData[],
    size: string = '800x600'
  ): string {
    if (locations.length === 0) {
      return `https://placehold.co/${size}?text=No+Location+Data+Available`;
    }

    const latest = locations[locations.length - 1];
    return `https://placehold.co/${size}?text=Interactive+Map%0ALatest:+${latest.latitude.toFixed(4)},+${latest.longitude.toFixed(4)}%0A${locations.length}+locations+tracked`;
  }

  static createMapMarker(location: LocationData, type: MapMarker['type']): MapMarker {
    return {
      id: `marker-${location.timestamp}`,
      latitude: location.latitude,
      longitude: location.longitude,
      title: `Location at ${new Date(location.timestamp).toLocaleTimeString()}`,
      description: `Accuracy: ${location.accuracy.toFixed(0)}m`,
      type,
    };
  }

  static calculateBounds(locations: LocationData[]): {
    northEast: [number, number];
    southWest: [number, number];
    center: [number, number];
  } {
    if (locations.length === 0) {
      return {
        northEast: [0, 0],
        southWest: [0, 0],
        center: [0, 0],
      };
    }

    let minLat = locations[0].latitude;
    let maxLat = locations[0].latitude;
    let minLng = locations[0].longitude;
    let maxLng = locations[0].longitude;

    locations.forEach(location => {
      minLat = Math.min(minLat, location.latitude);
      maxLat = Math.max(maxLat, location.latitude);
      minLng = Math.min(minLng, location.longitude);
      maxLng = Math.max(maxLng, location.longitude);
    });

    return {
      northEast: [maxLat, maxLng],
      southWest: [minLat, minLng],
      center: [(minLat + maxLat) / 2, (minLng + maxLng) / 2],
    };
  }

  static getOptimalZoom(accuracy: number): number {
    if (accuracy <= 10) return 18;
    if (accuracy <= 50) return 16;
    if (accuracy <= 100) return 15;
    if (accuracy <= 500) return 14;
    return 13;
  }

  static formatDegreeMinuteSecond(decimal: number): string {
    const degrees = Math.floor(Math.abs(decimal));
    const minutes = Math.floor((Math.abs(decimal) - degrees) * 60);
    const seconds = ((Math.abs(decimal) - degrees) * 60 - minutes) * 60;
    
    return `${degrees}° ${minutes}' ${seconds.toFixed(2)}"`;
  }

  static generateGoogleMapsLink(latitude: number, longitude: number): string {
    return `https://maps.google.com/?q=${latitude},${longitude}`;
  }

  static generateAppleMapsLink(latitude: number, longitude: number): string {
    return `https://maps.apple.com/?q=${latitude},${longitude}`;
  }

  static generateShareableLocationUrl(latitude: number, longitude: number): string {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}?lat=${latitude}&lng=${longitude}&shared=true`;
  }

  static parseLocationFromUrl(): { latitude: number; longitude: number } | null {
    if (typeof window === 'undefined') return null;
    
    const urlParams = new URLSearchParams(window.location.search);
    const lat = urlParams.get('lat');
    const lng = urlParams.get('lng');
    
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      
      if (!isNaN(latitude) && !isNaN(longitude)) {
        return { latitude, longitude };
      }
    }
    
    return null;
  }

  static generateQRCodeData(latitude: number, longitude: number): string {
    return `geo:${latitude},${longitude}`;
  }

  static isValidCoordinate(latitude: number, longitude: number): boolean {
    return (
      !isNaN(latitude) &&
      !isNaN(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  }

  static getLocationDescription(latitude: number, longitude: number): string {
    // Simple description based on coordinates
    const latDir = latitude >= 0 ? 'N' : 'S';
    const lngDir = longitude >= 0 ? 'E' : 'W';
    
    return `${Math.abs(latitude).toFixed(4)}°${latDir}, ${Math.abs(longitude).toFixed(4)}°${lngDir}`;
  }

  static calculateAreaFromLocations(locations: LocationData[]): number {
    if (locations.length < 3) return 0;
    
    // Simple polygon area calculation using shoelace formula
    let area = 0;
    const n = locations.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += locations[i].latitude * locations[j].longitude;
      area -= locations[j].latitude * locations[i].longitude;
    }
    
    return Math.abs(area) / 2;
  }

  static getTimezoneOffset(latitude: number, longitude: number): string {
    // This is a simplified timezone calculation
    // In production, you'd use a proper timezone API
    const offset = Math.round(longitude / 15);
    const sign = offset >= 0 ? '+' : '-';
    return `UTC${sign}${Math.abs(offset).toString().padStart(2, '0')}:00`;
  }
}