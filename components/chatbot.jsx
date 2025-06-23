import OpenAI from "openai";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { GiftedChat } from "react-native-gifted-chat";
import uuid from "react-native-uuid";

const openAI = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.EXPO_PUBLIC_DEEPSEEK_KEY,
});

const error = console.error;
console.error = (...args) => {
  if (/defaultProps/.test(args[0])) return;
  error(...args);
};

const ChatBot = () => {
  const [messages, setMessages] = useState([]);

  const test = async (userMessage) => {
    try {
      const completion = await openAI.chat.completions.create({
        messages: [
          { role: "system", content: "You are a helpful assistant" },
          { role: "user", content: userMessage },
        ],
        model: "deepseek-chat",
      });

      const aiMessage = completion.choices[0].message.content;
      const newMessage = {
        _id: uuid.v4(),
        text: aiMessage,
        createdAt: new Date(),
        user: {
          _id: 2,
          name: "Ai Assistant",
          avatar: "https://placeimg.com/140/140/any",
        },
      };
      setMessages((previousMessages) =>
        GiftedChat.append(previousMessages, [newMessage])
      );
    } catch (error) {
      console.error(error);
    }
  };

  const onSend = useCallback((messages = []) => {
    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, messages)
    );
    const userMessage = messages[0].text;
    test(userMessage);
  }, []);
  return (
    
      <GiftedChat
        messages={messages}
        onSend={(messages) => onSend(messages)}
        user={{
          _id: 1,
        }}
      />
   
  );
}

export default ChatBot