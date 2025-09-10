import { Redirect } from 'expo-router';

/**
 * Root route component.
 * 
 * This component simply redirects the user to the home screen.
 * The main layout (_layout.tsx) will handle authentication checks
 * and redirect to the login screen if necessary.
 */
export default function RootIndex() {
  return <Redirect href="/home" />;
}
