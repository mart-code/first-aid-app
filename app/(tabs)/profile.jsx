import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext'; // Adjust path as needed
import { router } from 'expo-router';

export default function Profile() {
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    const result = await signOut();
    if(result.success){
      router.push('/loginScreen')
    }
    else {
      Alert.alert('Logout Failed', result.error);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>You are not logged in.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.label}>Name:</Text>
      <Text style={styles.infoText}>{user.name || 'No name provided'}</Text>
      <Text style={styles.label}>Email:</Text>
      <Text style={styles.infoText}>{user.email}</Text>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  label: { fontSize: 16, fontWeight: '600', marginTop: 10 },
  infoText: { fontSize: 18, marginTop: 5, color: '#333' },
  logoutButton: {
    marginTop: 40,
    backgroundColor: '#FF3B30',
    paddingVertical: 15,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
