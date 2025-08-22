import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GiftedChat } from "react-native-gifted-chat";
import "react-native-url-polyfill/auto";
import { account, databases, ID, query, realtime } from "../../../Appwrite/Appwrite";
import { useAuth } from "../../../context/AuthContext";

export default function ChatScreen({ route }) {
  const router = useRouter();
  const { otherUserId: initialOtherUserId, requestId } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [otherUserId, setOtherUserId] = useState(initialOtherUserId);
  const [requestStatus, setRequestStatus] = useState('open');

  // Fetch current user ID and admin status
  useEffect(() => {
    async function fetchUser() {
      try {
        const user = await account.get();
        setCurrentUserId(user.$id);
        const profile = await databases.listDocuments(
          "ems-db",
          "user_profiles",
          [query.equal("userId", user.$id)]
        );
        setIsAdmin(profile.documents[0]?.isAdmin || false);
      } catch (error) {
        console.error("Error fetching user:", error);
        Alert.alert("Error", "Failed to load user data.");
      }
    }
    fetchUser();
  }, []);

  // Fetch request status and adminId
  useEffect(() => {
    async function fetchRequest() {
      try {
        const response = await databases.getDocument(
          "ems-db",
          "requests",
          requestId
        );
        setRequestStatus(response.status);
        if (response.adminId && response.adminId !== otherUserId) {
          setOtherUserId(response.adminId);
        }
      } catch (error) {
        console.error("Error fetching request:", error);
      }
    }
    fetchRequest();
  }, [requestId, otherUserId]);

  // Real-time subscription for request updates
  useEffect(() => {
    const unsubscribe = realtime.subscribe(
      `databases.ems-db.collections.requests.documents.${requestId}`,
      (payload) => {
        if (payload.events.includes('databases.*.collections.*.documents.*.update')) {
          setRequestStatus(payload.payload.status);
          if (payload.payload.adminId && payload.payload.adminId !== otherUserId) {
            setOtherUserId(payload.payload.adminId);
          }
          if (payload.payload.status === 'closed') {
            Alert.alert("Request Closed", "The doctor has closed this request.");
            router.navigate(isAdmin ? "../notifications" : "../dashboard");
          }
        }
      }
    );
    return () => unsubscribe();
  }, [requestId, otherUserId, isAdmin, router]);

  // Fetch existing messages
  async function getMessages(senderId, receiverId) {
    try {
      const response = await databases.listDocuments(
        "ems-db",
        "messages",
        [
          query.equal("senderId", [senderId, receiverId]),
          query.equal("receiverId", [senderId, receiverId]),
          query.orderDesc("timestamp"),
          query.limit(50),
        ]
      );
      const formattedMessages = response.documents.map((doc) => ({
        _id: doc.$id,
        text: doc.message,
        createdAt: new Date(doc.timestamp),
        user: { _id: doc.senderId },
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }

  // Send message
  async function sendMessage(senderId, receiverId, messageText) {
    try {
      const response = await databases.createDocument(
        "ems-db",
        "messages",
        ID.unique(),
        {
          senderId,
          receiverId,
          message: messageText,
          timestamp: new Date().toISOString(),
        }
      );
      console.log("Message sent:", response);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  // Close request (admin only)
  async function closeRequest() {
    try {
      await databases.updateDocument(
        "ems-db",
        "requests",
        requestId,
        { status: "closed" }
      );
      Alert.alert("Request Closed", "The request has been closed.");
      router.navigate("../notifications");
    } catch (error) {
      console.error("Error closing request:", error);
      Alert.alert("Error", "Failed to close request.");
    }
  }

  // Load messages when otherUserId is available
  useEffect(() => {
    if (currentUserId && otherUserId) {
      getMessages(currentUserId, otherUserId);
    }
  }, [currentUserId, otherUserId]);

  // Real-time subscription for messages
  useEffect(() => {
    if (!currentUserId || !otherUserId) return;

    const unsubscribe = realtime.subscribe(
      `databases.ems-db.collections.messages.documents`,
      (payload) => {
        if (payload.events.includes('databases.*.collections.*.documents.*.create')) {
          if (
            (payload.payload.senderId === currentUserId &&
              payload.payload.receiverId === otherUserId) ||
            (payload.payload.senderId === otherUserId &&
              payload.payload.receiverId === currentUserId)
          ) {
            const newMessage = {
              _id: payload.payload.$id,
              text: payload.payload.message,
              createdAt: new Date(payload.payload.timestamp),
              user: { _id: payload.payload.senderId },
            };
            setMessages((prev) => GiftedChat.append(prev, [newMessage]));
          }
        }
      }
    );
    return () => unsubscribe();
  }, [currentUserId, otherUserId]);

  const onSend = useCallback(
    (newMessages = []) => {
      if (!otherUserId) {
        Alert.alert("Error", "Waiting for a doctor to join the chat.");
        return;
      }
      const msg = newMessages[0];
      sendMessage(currentUserId, otherUserId, msg.text);
    },
    [currentUserId, otherUserId]
  );

  if (!currentUserId) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!otherUserId || requestStatus === 'open') {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Waiting for a doctor to join...</Text>
        {isAdmin && (
          <TouchableOpacity style={styles.closeButton} onPress={closeRequest}>
            <Ionicons name="close-circle" size={30} color="crimson" />
            <Text style={styles.closeButtonText}>Close Request</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isAdmin && (
        <TouchableOpacity style={styles.closeButton} onPress={closeRequest}>
          <Ionicons name="close-circle" size={30} color="crimson" />
          <Text style={styles.closeButtonText}>Close Request</Text>
        </TouchableOpacity>
      )}
      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{ _id: currentUserId }}
        placeholder="Type a message..."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    fontSize: 16,
    color: "#64748b",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 1,
  },
  closeButtonText: {
    color: "crimson",
    marginLeft: 5,
    fontWeight: "500",
  },
});