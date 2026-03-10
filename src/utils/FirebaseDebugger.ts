
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { Platform } from 'react-native';
import { Logger } from '../infrastructure/logging/Logger';
import { di } from '../core/di/container';

export class FirebaseDebugger {
  private logger: Logger;

  constructor() {
    // Use dependency injection or create new instance if DI not available
    try {
      this.logger = di.resolve('Logger') as Logger;
    } catch (error) {
      this.logger = new Logger();
    }
  }

  async runDiagnostics() {
    const diagnosticResults: any = {
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
      results: {},
    };

    try {
      // 1. Check Google Sign-In configuration
      diagnosticResults.results.googleSignInConfig = await this.checkGoogleSignInConfig();
      
      // 2. Check Firebase Auth state
      diagnosticResults.results.firebaseAuth = await this.checkFirebaseAuth();
      
      // 3. Check network connectivity
      diagnosticResults.results.network = await this.checkNetwork();
      
      // 4. Check Play Services (Android only)
      if (Platform.OS === 'android') {
        diagnosticResults.results.playServices = await this.checkPlayServices();
      }

      // 5. Check Firebase project configuration
      diagnosticResults.results.firebaseConfig = this.checkFirebaseConfig();

      this.logger.info('Firebase diagnostics completed', diagnosticResults);
      return diagnosticResults;

    } catch (error: any) {
      this.logger.error('Firebase diagnostics failed', error);
      diagnosticResults.error = error.message;
      return diagnosticResults;
    }
  }

  private async checkGoogleSignInConfig() {
    try {
      const config = GoogleSignin.configure();
      return {
        status: 'configured',
        webClientId: config.webClientId ? '***' + config.webClientId.slice(-4) : 'missing',
        offlineAccess: config.offlineAccess,
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  private async checkFirebaseAuth() {
    try {
      const currentUser = auth().currentUser;
      return {
        status: 'initialized',
        currentUser: currentUser ? {
          uid: currentUser.uid,
          email: currentUser.email,
          emailVerified: currentUser.emailVerified,
        } : 'no user',
        authReady: true,
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  private async checkNetwork() {
    // Simple network check by pinging Google
    try {
      const response = await fetch('https://www.google.com', { method: 'HEAD' });
      return {
        status: response.ok ? 'connected' : 'failed',
        responseCode: response.status,
      };
    } catch (error: any) {
      return {
        status: 'offline',
        error: error.message,
      };
    }
  }

  private async checkPlayServices() {
    try {
      const hasPlayServices = await GoogleSignin.hasPlayServices();
      return {
        status: hasPlayServices ? 'available' : 'unavailable',
        hasPlayServices,
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  private checkFirebaseConfig() {
    const config = {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    };

    return {
      apiKey: config.apiKey ? 'configured' : 'missing',
      projectId: config.projectId ? 'configured' : 'missing',
      appId: config.appId ? 'configured' : 'missing',
      allConfigured: config.apiKey && config.projectId && config.appId,
    };
  }

  // Method to generate configuration fix suggestions
  generateFixSuggestions(diagnosticResults: any) {
    const suggestions: string[] = [];

    if (diagnosticResults.results.googleSignInConfig?.status === 'error') {
      suggestions.push('Check Google Sign-In configuration in GoogleAuthService');
    }

    if (diagnosticResults.results.firebaseAuth?.status === 'error') {
      suggestions.push('Verify Firebase initialization and configuration');
    }

    if (diagnosticResults.results.network?.status === 'offline') {
      suggestions.push('Check internet connectivity and network settings');
    }

    if (diagnosticResults.results.playServices?.status === 'unavailable') {
      suggestions.push('Update Google Play Services on Android device');
    }

    if (!diagnosticResults.results.firebaseConfig?.allConfigured) {
      suggestions.push('Complete Firebase configuration in environment variables');
    }

    return suggestions;
  }
}

// Utility function to run diagnostics from anywhere
export async function runFirebaseDiagnostics() {
  const firebaseDebugger = new FirebaseDebugger();
  return await firebaseDebugger.runDiagnostics();
}
