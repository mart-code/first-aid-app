import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  CheckBox,
} from "react-native";
import { useAuth } from "../../context/AuthContext";

const LoginScreen = () => {
  const router = useRouter();
  const { signIn, signUp, user, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminDetails, setAdminDetails] = useState({
    role: "Doctor", // Default role
    state: "",
    number: "",
    organization: "",
  });

  const handleLogin = async () => {
    await signOut(); // Ensure user is signed out before login
    const result = await signIn(email, password);
    if (result.success) {
      Alert.alert("Login Successful");
      router.push("/dashboard/home");
    } else {
      Alert.alert("Login Failed", result.error);
    }
  };

  const handleRegister = async () => {
    await signOut();
    if (isAdmin && (!adminDetails.state || !adminDetails.number || !adminDetails.organization)) {
  Alert.alert("Error", "All admin fields are required");
  return;
}
    const result = await signUp(email, password, name, isAdmin, adminDetails);
    if (result.success) {
      Alert.alert("Registration Successful");
      router.push("/dashboard");
    } else {
      Alert.alert("Registration Failed", result.error);
    }
  };

  if (user) {
    router.push("/dashboard");
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isRegistering ? "Register" : "Login"}</Text>
      {isRegistering && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            onChangeText={setName}
            placeholderTextColor={'#666'}
          />
          <View style={styles.checkboxContainer}>
            <CheckBox
              value={isAdmin}
              onValueChange={setIsAdmin}
              tintColors={{ true: 'crimson', false: '#666' }}
            />
            <Text style={styles.checkboxLabel}>Register as Admin (Doctor/Firefighter)</Text>
          </View>
          {isAdmin && (
            <>
              <View style={styles.selectContainer}>
                <Text style={styles.selectLabel}>Role:</Text>
                <View style={styles.selectWrapper}>
                  <TouchableOpacity
                    style={[styles.selectButton, adminDetails.role === "Doctor" && styles.selectButtonActive]}
                    onPress={() => setAdminDetails({ ...adminDetails, role: "Doctor" })}
                  >
                    <Text style={styles.selectButtonText}>Doctor</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.selectButton, adminDetails.role === "Firefighter" && styles.selectButtonActive]}
                    onPress={() => setAdminDetails({ ...adminDetails, role: "Firefighter" })}
                  >
                    <Text style={styles.selectButtonText}>Firefighter</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TextInput
                style={styles.input}
                placeholder="State"
                value={adminDetails.state}
                onChangeText={(text) => setAdminDetails({ ...adminDetails, state: text })}
                placeholderTextColor={'#666'}
              />
              <TextInput
                style={styles.input}
                placeholder="Contact Number"
                value={adminDetails.number}
                onChangeText={(text) => setAdminDetails({ ...adminDetails, number: text })}
                placeholderTextColor={'#666'}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Organization Name"
                value={adminDetails.organization}
                onChangeText={(text) => setAdminDetails({ ...adminDetails, organization: text })}
                placeholderTextColor={'#666'}
              />
            </>
          )}
        </>
      )}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        placeholderTextColor={'#666'}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor={'#666'}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={isRegistering ? handleRegister : handleLogin}
      >
        <Text style={styles.buttonText}>
          {isRegistering ? "Register" : "Login"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
        <Text style={styles.toggleText}>
          {isRegistering
            ? "Already have an account? Login"
            : "Don't have an account? Register"}
        </Text>
      </TouchableOpacity>
      {user && (
        <Text style={styles.loggedInText}>
          Logged in as {user.name || user.email}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
    color: "#111",
  },
  button: { backgroundColor: "crimson", padding: 15, borderRadius: 5 },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  toggleText: { marginTop: 15, textAlign: "center", color: "crimson" },
  loggedInText: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 16,
    color: "green",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  checkboxLabel: {
    marginLeft: 10,
    fontSize: 16,
    color: "#111",
  },
  selectContainer: {
    marginBottom: 15,
  },
  selectLabel: {
    fontSize: 16,
    color: "#111",
    marginBottom: 5,
  },
  selectWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  selectButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    alignItems: "center",
  },
  selectButtonActive: {
    backgroundColor: "crimson",
    borderColor: "crimson",
  },
  selectButtonText: {
    color: "#111",
    fontWeight: "bold",
  },
});

export default LoginScreen;