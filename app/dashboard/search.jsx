import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import * as Location from 'expo-location';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_APPWRITE_MAPBOX_API);

const HEALTH_CENTERS = [
  { id: 1, name: 'Health Center 1', coords: [3.3792, 6.5244] }, // Example: Lagos
  { id: 2, name: 'Health Center 2', coords: [3.3892, 6.5344] }
];

export default function MapScreen() {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    (async () => {
  
      let loc = await Location.getCurrentPositionAsync({});
      setLocation([loc.coords.longitude, loc.coords.latitude]);
    })();
  }, []);

  if (!location) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapboxGL.MapView style={{ flex: 1 }}>
        <MapboxGL.Camera
          zoomLevel={14}
          centerCoordinate={location}
        />
        <MapboxGL.PointAnnotation
          id="user-location"
          coordinate={location}
        />
        {HEALTH_CENTERS.map(center => (
          <MapboxGL.PointAnnotation
            key={center.id}
            id={`center-${center.id}`}
            coordinate={center.coords}
          />
        ))}
      </MapboxGL.MapView>
    </View>
  );
}
