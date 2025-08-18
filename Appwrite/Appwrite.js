import { Client, Account, ID, Realtime, Databases, Query } from 'react-native-appwrite';
import 'react-native-url-polyfill/auto';

const client = new Client();
const query = new Query();

client
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_API_ENDPOINT) 
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID) 
  .setPlatform(process.env.EXPO_PUBLIC_APPWRITE_PACKAGE_ID);

const account = new Account(client);
const realtime = new Realtime(client);
const databases = new Databases(client);

export { client, account, ID, realtime, databases, query };
