// components/ChatBotCustom.jsx
import OpenAI from "openai";
import { useRef, useState, useEffect } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
} from "react-native";
import uuid from "react-native-uuid";

const openAI = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.EXPO_PUBLIC_DEEPSEEK_KEY,
});

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef(null);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        scrollToBottom();
      }
    );
    const hideSubscription = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Send user message and get AI response
  const sendMessageToAI = async (userMessage) => {
    try {
      const response = await openAI.chat.completions.create({
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: userMessage },
        ],
        model: "deepseek/deepseek-r1:free",
      });

      const aiReply = response.choices[0].message.content;

      const aiMessage = {
        _id: uuid.v4(),
        text: aiReply,
        createdAt: new Date(),
        user: {
          _id: 2,
          name: "AI Assistant",
        },
      };

      setMessages((prev) => [...prev, aiMessage]);
      scrollToBottom();
    } catch (err) {
      console.error("AI response error:", err);
    }
  };

  // Handle sending user message
  const onSend = () => {
    if (inputText.trim().length === 0) return;

    const userMessage = {
      _id: uuid.v4(),
      text: inputText.trim(),
      createdAt: new Date(),
      user: {
        _id: 1,
        name: "User",
      },
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    scrollToBottom();

    sendMessageToAI(userMessage.text);
  };

  // Scroll FlatList to bottom
  const scrollToBottom = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  // Render each message bubble
  const renderItem = ({ item }) => {
    const isUser = item.user._id === 1;
    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.aiMessage,
        ]}
      >
        <Text style={styles.messageText}>{item.text}</Text>
        <Text style={styles.timeText}>
          {item.createdAt.toLocaleTimeString()}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id.toString()}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.chatContainer,
          { paddingBottom: keyboardHeight + 20 },
        ]}
        onContentSizeChange={scrollToBottom}
        keyboardShouldPersistTaps="handled"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.select({
          ios: 60,
          android: keyboardHeight,
        })}
        style={styles.keyboardAvoidingContainer}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message here..."
            placeholderTextColor="#888"
            multiline
          />
          <TouchableOpacity onPress={onSend} style={styles.sendButton}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  keyboardAvoidingContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  chatContainer: { padding: 10, paddingBottom: 80, backgroundColor: 'black', color: '#ffffff' },
  messageContainer: {
    maxWidth: "80%",
    marginVertical: 5,
    padding: 10,
    borderRadius: 10,
  },
  userMessage: {
    backgroundColor: "#0084ff",
    alignSelf: "flex-end",
    borderTopRightRadius: 0,
  },
  aiMessage: {
    backgroundColor: "#e5e5ea",
    alignSelf: "flex-start",
    borderTopLeftRadius: 0,
  },
  messageText: {
    color: "#fff",
    fontSize: 16,
  },
  aiMessageText: {
    color: "#000",
    fontSize: 16,
  },
  timeText: {
    fontSize: 10,
    color: "#ddd",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  inputContainer: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#f9f9f9",
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    color: "#111",
    borderColor: "#ccc",
    maxHeight: 100,
  },
  sendButton: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 15,
    marginLeft: 8,
    backgroundColor: "#0084ff",
    borderRadius: 20,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
