import MapboxGL from "@rnmapbox/maps";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_APPWRITE_MAPBOX_API);

// Custom marker images (add these to your assets)
const markerImages = {
  health: require("../../assets/images/marker.png"),
  fire: require("../../assets/images/marker.png"),
  safety: require("../../assets/images/marker.png"),
  user: require("../../assets/images/marker.png"),
};

export default function Search() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [locations, setLocations] = useState({
    healthCenters: [],
    fireStations: [],
    roadSafety: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        setLoading(false);
        return;
      }

      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation([loc.coords.longitude, loc.coords.latitude]);
        await fetchNearbyLocations(loc.coords.latitude, loc.coords.longitude);
      } catch (error) {
        setErrorMsg("Error getting location");
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNearbyLocations = async (latitude, longitude) => {
    try {
      const [healthCenters, fireStations, roadSafety] = await Promise.all([
        fetchPlaces("hospital", latitude, longitude),
        fetchPlaces("fire_station", latitude, longitude),
        fetchPlaces("police", latitude, longitude), // Using police for road safety
      ]);

      setLocations({
        healthCenters,
        fireStations,
        roadSafety,
      });
    } catch (error) {
      console.error("Error fetching locations:", error);
      setErrorMsg("Error fetching nearby locations");
    }
  };

  const fetchPlaces = async (query, lat, lon) => {
    const url = `https://nominatim.openstreetmap.org/search.php?q=${query}+near+${lat},${lon}&format=jsonv2&limit=5`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "EmergencyHealthcareApp/1.0 (aamadewoyin@gmail.com)",
      },
    });

    const data = await response.json();
    return data.map((place) => ({
      id: place.place_id,
      name: place.display_name,
      coords: [parseFloat(place.lon), parseFloat(place.lat)],
    }));
  };

  const renderMarkers = () => {
    return (
      <View>
        {/* User Location Marker */}
        {location && (
          <MapboxGL.MarkerView
            coordinate={location}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <Image
              source={markerImages.user}
              style={{ width: 32, height: 32 }}
            />
          </MapboxGL.MarkerView>
        )}

        {/* Health Centers */}
        {locations.healthCenters.map((center) => (
          <MapboxGL.MarkerView
            key={`health-${center.id}`}
            coordinate={center.coords}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <Image
              source={markerImages.health}
              style={{ width: 28, height: 28 }}
            />
          </MapboxGL.MarkerView>
        ))}

        {/* Fire Stations */}
        {locations.fireStations.map((station) => (
          <MapboxGL.MarkerView
            key={`fire-${station.id}`}
            coordinate={station.coords}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <Image
              source={markerImages.fire}
              style={{ width: 28, height: 28 }}
            />
          </MapboxGL.MarkerView>
        ))}

        {/* Road Safety */}
        {locations.roadSafety.map((safety) => (
          <MapboxGL.MarkerView
            key={`safety-${safety.id}`}
            coordinate={safety.coords}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <Image
              source={markerImages.safety}
              style={{ width: 28, height: 28 }}
            />
          </MapboxGL.MarkerView>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapboxGL.MapView style={{ flex: 1 }}>
        <MapboxGL.Camera
          zoomLevel={14}
          centerCoordinate={location}
          animationMode={"flyTo"}
          animationDuration={2000}
        />

        <MapboxGL.Style style={MapboxGL.Style.Street} />
        {renderMarkers()}

        {/* User location circle */}
        <MapboxGL.CircleLayer
          id="userLocationCircle"
          style={{
            circleRadius: 8,
            circleColor: "#007AFF",
            circleOpacity: 0.5,
          }}
        />
      </MapboxGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "red",
    textAlign: "center",
  },
});
