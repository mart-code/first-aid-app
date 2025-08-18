import { View, Text } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { ID, account, databases, query, realtime } from '../../Appwrite/Appwrite';
import 'react-native-url-polyfill/auto'; // Polyfill for Appwrite
import { GiftedChat } from 'react-native-gifted-chat';



export default function ChatScreen({ route }) {
  const { otherUserId } = route.params; // Get other user ID from navigation
  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Fetch current user ID on mount
  useEffect(() => {
    async function fetchUser() {
      try {
        const user = await account.get();
        setCurrentUserId(user.$id);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    }
    fetchUser();
  }, []);

  // Fetch existing messages
  async function getMessages(senderId, receiverId) {
    try {
      const response = await databases.listDocuments(
        'ems-db', // Replace with your database ID
        'messages', // Collection ID
        [
          query.equal('senderId', [senderId, receiverId]), // Messages from/to both
          query.equal('receiverId', [senderId, receiverId]),
          query.orderDesc('timestamp'), // Newest first
          query.limit(50), // Paginate as needed
        ]
      );
      // Format for GiftedChat
      const formattedMessages = response.documents.map((doc) => ({
        _id: doc.$id,
        text: doc.message,
        createdAt: new Date(doc.timestamp),
        user: { _id: doc.senderId },
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }

  // Send message
  async function sendMessage(senderId, receiverId, messageText) {
    try {
      const response = await databases.createDocument(
        'ems-db', // Replace with your database ID
        'messages', // Collection ID
        ID.unique(), // Auto-generate document ID
        {
          senderId,
          receiverId,
          message: messageText,
          timestamp: new Date().toISOString(),
        }
      );
      console.log('Message sent:', response);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  // Load messages when currentUserId is available
  useEffect(() => {
    if (currentUserId && otherUserId) {
      getMessages(currentUserId, otherUserId);
    }
  }, [currentUserId, otherUserId]);

  // Real-time subscription
  useEffect(() => {
    if (!currentUserId || !otherUserId) return;

    const unsubscribe = realtime.subscribe(
      `databases.YOUR_DATABASE_ID.collections.messages.documents`, // Replace with your database ID
      (payload) => {
        if (payload.events.includes('databases.*.collections.*.documents.*.create')) {
          // Check if message is for this chat
          if (
            (payload.payload.senderId === currentUserId && payload.payload.receiverId === otherUserId) ||
            (payload.payload.senderId === otherUserId && payload.payload.receiverId === currentUserId)
          ) {
            // Format for GiftedChat
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

    return () => unsubscribe(); // Clean up on unmount
  }, [currentUserId, otherUserId]);

  // Handle sending messages
  const onSend = useCallback((newMessages = []) => {
    const msg = newMessages[0];
    sendMessage(currentUserId, otherUserId, msg.text);
  }, [currentUserId, otherUserId]);

  if (!currentUserId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <GiftedChat
      messages={messages}
      onSend={onSend}
      user={{ _id: currentUserId }}
      placeholder="Type a message..."
    />
  );
}