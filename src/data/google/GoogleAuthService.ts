
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { di } from '@app/core/di/container';
import { Logger } from '@app/infrastructure/logging/Logger';
import NetInfo from '@react-native-community/netinfo';

// Add missing FirebaseDebugger import at the end of the file for consistency
import { FirebaseDebugger } from '@app/utils/FirebaseDebugger';

export class GoogleAuthService {
  private logger = di.resolve('Logger') as Logger;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;

  constructor() {
    GoogleSignin.configure({
      webClientId: '102802199932-lnv0non6dphbc4i6r8rrd4motkct34gq.apps.googleusercontent.com',
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
  }

  async signIn(): Promise<{ user: any; idToken: string }> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        this.logger.debug(`Google sign-in attempt ${attempt}/${this.MAX_RETRIES}`);
        
        // Check network connectivity
        const networkState = await NetInfo.fetch();
        if (!networkState.isConnected) {
          throw new Error('No network connectivity');
        }

        // Check if Play Services are available
        const hasPlayServices = await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
        
        if (!hasPlayServices) {
          throw new Error('Google Play Services not available');
        }

        // Perform sign-in
        const userInfo = await GoogleSignin.signIn();
        
        if (!userInfo.idToken) {
          throw new Error('No ID token received from Google');
        }

        // Create Firebase credential and sign in
        const googleCredential = auth.GoogleAuthProvider.credential(userInfo.idToken);
        const authResult = await auth().signInWithCredential(googleCredential);
        
        this.logger.info('Google sign-in successful', {
          userId: authResult.user.uid,
          email: authResult.user.email,
        });
        
        return {
          user: userInfo.user,
          idToken: userInfo.idToken,
        };
      } catch (error: any) {
        lastError = error;
        this.logger.error(`Google sign-in attempt ${attempt} failed`, {
          error: error.message,
          code: error.code,
          stack: error.stack,
        });

        // Don't retry for user cancellation
        if (error.code === 'SIGN_IN_CANCELLED') {
          break;
        }

        // Wait before retry
        if (attempt < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempt));
        }
      }
    }

    throw new Error(`Google sign-in failed after ${this.MAX_RETRIES} attempts: ${lastError?.message}`);
  }

  async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut();
      await auth().signOut();
      this.logger.info('Google sign-out successful');
    } catch (error: any) {
      this.logger.error('Google sign-out failed', {
        error: error.message,
        code: error.code,
      });
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const currentUser = await GoogleSignin.getCurrentUser();
      return currentUser;
    } catch (error) {
      this.logger.error('Failed to get current user', error);
      return null;
    }
  }

  // Utility method to check auth state
  async isSignedIn(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return !!user;
    } catch (error) {
      return false;
    }
  }
}
