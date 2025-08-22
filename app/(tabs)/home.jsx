import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { databases, ID } from '../../Appwrite/Appwrite';

 const Home = () => {
   const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [places, setPlaces] = useState([]); // Initialize as empty array instead of null

const fetchNearbyPlaces = async (latitude, longitude, radius = 5000) => {
  const overpassQuery = `[out:json][timeout:25];
    (
      node["amenity"="hospital"](around:${radius},${latitude},${longitude});
      way["amenity"="hospital"](around:${radius},${latitude},${longitude});
      relation["amenity"="hospital"](around:${radius},${latitude},${longitude});
      node["amenity"="clinic"](around:${radius},${latitude},${longitude});
      way["amenity"="clinic"](around:${radius},${latitude},${longitude});
      relation["amenity"="clinic"](around:${radius},${latitude},${longitude});
      node["amenity"="fire_station"](around:${radius},${latitude},${longitude});
      way["amenity"="fire_station"](around:${radius},${latitude},${longitude});
      relation["amenity"="fire_station"](around:${radius},${latitude},${longitude});
      node["healthcare"="hospital"](around:${radius},${latitude},${longitude});
      way["healthcare"="hospital"](around:${radius},${latitude},${longitude});
      relation["healthcare"="hospital"](around:${radius},${latitude},${longitude});
      node["healthcare"="clinic"](around:${radius},${latitude},${longitude});
      way["healthcare"="clinic"](around:${radius},${latitude},${longitude});
      relation["healthcare"="clinic"](around:${radius},${latitude},${longitude});
    );
    out center;`;

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    });
    const data = await response.json();
    return data.elements
      .filter((place) => place.tags.name && place.tags.name !== 'Unknown') // Filter out places without a valid name
      .map((place) => ({
        id: place.id,
        name: place.tags.name, // No need for fallback since we filtered out undefined names
        type: place.tags.amenity,
        latitude: place.lat || place.center.lat,
        longitude: place.lon || place.center.lon,
        address: place.tags['addr:full'] || `${place.tags['addr:street'] || ''}, ${place.tags['addr:city'] || ''}`,
      }));
  } catch (error) {
    console.error('Error fetching places:', error);
    setErrorMsg('Failed to fetch nearby places');
    return [];
  }
};

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(location.coords);

      // Fetch nearby places
      const nearbyPlaces = await fetchNearbyPlaces(location.coords.latitude, location.coords.longitude);
      console.log(nearbyPlaces);
      setPlaces(nearbyPlaces);
    })();
  }, []);
  const createRequest = async () => {
    try {
      const response = await databases.createDocument(
        'ems-db',
        'requests',
        ID.unique(),
        {
          userId: user.$id,
          status: 'open',
          type: 'Chat with Doctor',
          createdAt: new Date().toISOString(),
        },
        [`user:${user.$id}`, 'role:admin']
      );
      Alert.alert('Request Created', 'Your request to chat with a doctor has been sent.');
      router.push({
        pathname: '../services/doctor',
        params: { requestId: response.$id, otherUserId: null },
      });
    } catch (error) {
      console.error('Error creating request:', error);
      Alert.alert('Error', 'Failed to create request.');
    }
  };

  const emergencyOptions = [
    { id: 1, title: 'Report Accident', icon: 'alert-circle', color: '#ef4444' },
    { id: 2, title: 'Request Firefighter', icon: 'flame', color: '#f97316' },
    { id: 3, title: 'Chat with Doctor', icon: 'medical', color: '#3b82f6' },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Emergency Services</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {emergencyOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[styles.emergencyCard, { backgroundColor: option.color }]}
            onPress={() => {
              if (option.title === 'Report Accident') {
                router.push('../services/accident');
              } else if (option.title === 'Request Firefighter') {
                router.push('../services/firefighter');
              } else {
                createRequest();
              }
            }}
          >
            <Ionicons name={option.icon} size={30} color="white" />
            <Text style={styles.emergencyText}>{option.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={styles.sectionTitle}>Nearby Health Centers</Text>
      {errorMsg ? (
        <Text style={styles.errorText}>{errorMsg}</Text>
      ) : !location ? (
        <Text style={styles.loadingText}>Loading your location...</Text>
      ) : places.length === 0 ? (
        <Text style={styles.loadingText}>No nearby health centers found.</Text>
      ) : (
        <View style={styles.centersList}>
          {places.map((center) => (
            <TouchableOpacity
              key={center.id}
              style={styles.centerCard}
              onPress={() =>
                Linking.openURL(
                  `https://www.google.com/maps/dir/?api=1&destination=${center.latitude},${center.longitude}`
                )
              }
            >
              <Ionicons name="medkit" size={24} color="#3b82f6" />
              <View style={styles.centerInfo}>
                <Text style={styles.centerName}>{center.name}</Text>
                <Text style={styles.centerDistance}>{center.address}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#64748b" />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1e293b',
  },
  horizontalScroll: {
    marginBottom: 20,
  },
  emergencyCard: {
    width: 120,
    height: 120,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyText: {
    color: 'white',
    marginTop: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  centersList: {
    marginTop: 12,
  },
  centerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  centerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  centerName: {
    fontWeight: '500',
    color: '#1e293b',
  },
  centerDistance: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    marginVertical: 20,
  },
  loadingText: {
    color: '#64748b',
    textAlign: 'center',
    marginVertical: 20,
  },
});

export default Home