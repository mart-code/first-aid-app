import { Client, Account, ID } from 'react-native-appwrite';
import 'react-native-url-polyfill/auto';
const client = new Client();

client
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_API_ENDPOINT) 
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID) 
  .setPlatform(process.env.EXPO_PUBLIC_APPWRITE_PACKAGE_ID);

const account = new Account(client);

export { client, account, ID };
