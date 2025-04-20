import { Redirect } from 'expo-router';

// Redirect to the auth flow
export default function Index() {
  return <Redirect href="/(auth)" />;
}