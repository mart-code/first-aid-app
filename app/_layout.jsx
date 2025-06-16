import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";

const RootLayout = () => {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            textAlign: "center",
            backgroundColor: "#111",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontSize: 20,
            fontWeight: "bold",
          },
          contentStyle: {
            paddingHorizontal: 10,
            paddingTop: 10,
            backgroundColor: "#fff",
          },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Home" }} />
        <Stack.Screen name="dashboard" options={{ headerTitle: "Dashboard" }} />
        <Stack.Screen name="loginScreen" options={{ headerTitle: "login" }} />
      </Stack>
    </AuthProvider>
  );
};

export default RootLayout;
