// screens/LoginScreen.js
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";

const LoginScreen = () => {
  const router = useRouter();
  const { signIn, signUp, user, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLogin = async () => {
    await signOut(); // Ensure user is signed out before login
    const result = await signIn(email, password);
    if (result.success) {
      Alert.alert("Login Successful");
      router.push("/dashboard");
    } else {
      Alert.alert("Login Failed", result.error);
    }
  };

  if (user) {
    // If user is already logged in, redirect to dashboard
    router.push("/dashboard");
    return null; 
  }

  const handleRegister = async () => {
    await signOut();

    const result = await signUp(email, password, name);
    if (result.success) {
      Alert.alert("Registration Successful");
      router.push("/dashboard");
    } else Alert.alert("Registration Failed", result.error);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isRegistering ? "Register" : "Login"}</Text>
      {isRegistering && (
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
           placeholderTextColor={'#666'}
        />
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
});

export default LoginScreen;
