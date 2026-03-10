
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/theme';
import { useNavigation } from '@react-navigation/native';
import { GoogleAuthService } from '../../data/google/GoogleAuthService';
import { runFirebaseDiagnostics } from '@utils/FirebaseDebugger';
import { styles } from './AuthScreen.styles';

export function AuthScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setDebugInfo('Starting authentication...');

    try {
      const authService = new GoogleAuthService();

      // Run diagnostics first if in development
      if (__DEV__) {
        setDebugInfo('Running diagnostics...');
        const diagnostics = await runFirebaseDiagnostics();
        console.log('Firebase Diagnostics:', diagnostics);
      }

      setDebugInfo('Signing in with Google...');
      const result = await authService.signIn();

      setDebugInfo('Authentication successful, navigating to main app...');

      const needsOnboarding = await checkUserOnboardingStatus(result.user);

      if (needsOnboarding) {
        (navigation as any).navigate('Onboarding');
      } else {
        (navigation as any).navigate('Main');
      }

    } catch (error: any) {
      console.error('Sign-in failed:', error);
      setDebugInfo(`Error: ${error.message}`);

      // Show user-friendly error message
      let errorMessage = 'Sign-in failed. Please try again.';

      if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message.includes('SIGN_IN_CANCELLED')) {
        errorMessage = 'Sign-in cancelled.';
        setDebugInfo('User cancelled sign-in');
        return;
      } else if (error.message.includes('Play Services')) {
        errorMessage = 'Google Play Services required. Please update from Play Store.';
      }

      Alert.alert('Authentication Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const checkUserOnboardingStatus = async (user: any): Promise<boolean> => {
    // Implement your logic to check if user has completed onboarding
    // This could check Firestore, local storage, or user properties
    try {
      // For now, assume all new users need onboarding
      return true;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return true; // Default to showing onboarding on error
    }
  };

  const runDebugDiagnostics = async () => {
    setDebugInfo('Running full diagnostics...');
    const diagnostics = await runFirebaseDiagnostics();
    setDebugInfo(`Diagnostics: ${JSON.stringify(diagnostics.results, null, 2)}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Welcome to MindEase
      </Text>

      <TouchableOpacity
        style={[styles.googleButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleGoogleSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.background} />
        ) : (
          <Text style={[styles.googleButtonText, { color: theme.colors.background }]}>
            Sign in with Google
          </Text>
        )}
      </TouchableOpacity>

      {__DEV__ && debugInfo && (
        <View style={styles.debugContainer}>
          <Text style={[styles.debugText, { color: theme.colors.secondary }]}>
            {debugInfo}
          </Text>
        </View>
      )}

      {__DEV__ && (
        <TouchableOpacity
          style={[styles.debugButton, { backgroundColor: theme.colors.secondary }]}
          onPress={runDebugDiagnostics}
        >
          <Text style={[styles.debugButtonText, { color: theme.colors.background }]}>
            Run Diagnostics
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
