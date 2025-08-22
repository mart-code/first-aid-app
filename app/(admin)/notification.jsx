import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {databases, query, realtime, account } from '../../Appwrite/Appwrite';
import { useAuth } from '../../context/AuthContext';
import 'react-native-url-polyfill/auto';


export default function Notifications() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userNames, setUserNames] = useState({}); // Cache user names

  // Fetch admin status and requests
  useEffect(() => {
    const fetchProfileAndRequests = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        // Check if user is admin
        const profile = await databases.listDocuments(
          'ems-db', // Replace with your database ID
          'user_profiles',
          [query.equal('userId', user.$id)]
        );
        if (profile.documents[0]?.isAdmin) {
          setIsAdmin(true);
          // Fetch open requests
          const response = await databases.listDocuments(
            'ems-db',
            'requests',
            [
              query.equal('status', 'open'),
              query.equal('type', 'Chat with Doctor'),
              query.orderDesc('createdAt'),
              query.limit(50),
            ]
          );
          const requests = response.documents;
          setRequests(requests);

          // Fetch user names for requests
          const names = {};
          for (const request of requests) {
            try {
              const userProfile = await databases.listDocuments(
                'ems-db',
                'user_profiles',
                [query.equal('userId', request.userId)]
              );
              const userAccount = await account.get(request.userId); // Fallback to account
              names[request.userId] = userProfile.documents[0]?.name || userAccount?.name || userAccount?.email || 'Unknown User';
            } catch (error) {
              console.error(`Error fetching name for user ${request.userId}:`, error);
              names[request.userId] = 'Unknown User';
            }
          }
          setUserNames(names);
        }
      } catch (error) {
        console.error('Error fetching profile or requests:', error);
        Alert.alert('Error', 'Failed to load notifications.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfileAndRequests();
  }, [user]);

  // Real-time subscription for new requests
  useEffect(() => {
    if (!isAdmin) return;

    const unsubscribe = realtime.subscribe(
      `databases.YOUR_DATABASE_ID.collections.requests.documents`,
      async (payload) => {
        if (payload.events.includes('databases.*.collections.*.documents.*.create') &&
            payload.payload.status === 'open' &&
            payload.payload.type === 'Chat with Doctor') {
          // Fetch user name for new request
          try {
            const userProfile = await databases.listDocuments(
              'YOUR_DATABASE_ID',
              'user_profiles',
              [query.equal('userId', payload.payload.userId)]
            );
            const userAccount = await account.get(payload.payload.userId);
            const userName = userProfile.documents[0]?.name || userAccount?.name || userAccount?.email || 'Unknown User';
            setUserNames((prev) => ({ ...prev, [payload.payload.userId]: userName }));
            setRequests((prev) => [payload.payload, ...prev]);
          } catch (error) {
            console.error('Error fetching user name for new request:', error);
            setUserNames((prev) => ({ ...prev, [payload.payload.userId]: 'Unknown User' }));
            setRequests((prev) => [payload.payload, ...prev]);
          }
        }
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  const handleRequestClick = async (request) => {
    try {
      // Update request to assign admin
      await databases.updateDocument(
        'YOUR_DATABASE_ID',
        'requests',
        request.$id,
        { adminId: user.$id, status: 'accepted' }
      );
      router.push({
        pathname: '../chat',
        params: { otherUserId: request.userId, requestId: request.$id },
      });
    } catch (error) {
      console.error('Error assigning request:', error);
      Alert.alert('Error', 'Failed to open chat.');
    }
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Please log in to view notifications.</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Access restricted to admins only.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Notifications</Text>
      {requests.length === 0 ? (
        <Text style={styles.noRequestsText}>No open requests found.</Text>
      ) : (
        <View style={styles.requestList}>
          {requests.map((request) => (
            <TouchableOpacity
              key={request.$id}
              style={styles.requestCard}
              onPress={() => handleRequestClick(request)}
            >
              <Ionicons name="chatbubble-ellipses" size={24} color="#3b82f6" />
              <View style={styles.requestInfo}>
                <Text style={styles.requestName}>Chat Request from {userNames[request.userId]}</Text>
                <Text style={styles.requestTime}>
                  {new Date(request.createdAt).toLocaleString()}
                </Text>
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
  requestList: {
    marginTop: 12,
  },
  requestCard: {
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
  requestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  requestName: {
    fontWeight: '500',
    color: '#1e293b',
  },
  requestTime: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    color: '#64748b',
    fontSize: 16,
    textAlign: 'center',
  },
  noRequestsText: {
    color: '#64748b',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
});