import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function AdminLayout() {
  return (
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: "#3b82f6",
            tabBarInactiveTintColor: "#64748b",
            headerShown: false,
          }}
        >
          <Tabs.Screen
            name="notification"
            options={{
              title: "notification",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="home" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="chatRoom"
            options={{
              title: "chatRoom",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="search" size={size} color={color} />
              ),
            }}
          />

        </Tabs>
  );
}
