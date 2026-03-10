
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Logger } from '../logging/Logger';
import { di } from '../../core/di/container';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getReactNativePersistence } from 'firebase/auth/react-native';

// Firebase configuration from google-services.json and GoogleService-Info.plist
const firebaseConfig = {
  apiKey: 'AIzaSyCFDUEP71AhOGnlvm5WSfUa1f4_PrcM2Zc',
  authDomain: 'projeto-bytebank.firebaseapp.com',
  projectId: 'projeto-bytebank',
  storageBucket: 'projeto-bytebank.firebasestorage.app',
  messagingSenderId: '102802199932',
  appId: '1:102802199932:android:f8b12915708d672a6880f9',
  measurementId: 'G-XXXXXXXXXX'
};

export class FirebaseInitializer {
  private logger: Logger;
  private isInitialized = false;

  constructor() {
    this.logger = di.resolve('Logger') as Logger;
  }

  initialize() {
    if (this.isInitialized) {
      this.logger.warn('Firebase already initialized');
      return;
    }

    try {
      // Validate configuration
      this.validateConfig();

      const app = initializeApp(firebaseConfig);
      
      // Initialize auth with persistence
      const auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });

      const firestore = getFirestore(app);
      
      this.isInitialized = true;
      this.logger.info('Firebase initialized successfully', {
        projectId: firebaseConfig.projectId,
        platform: Platform.OS,
      });
      
      return { app, auth, firestore };
    } catch (error: any) {
      this.logger.error('Firebase initialization failed', {
        error: error.message,
        code: error.code,
        config: this.getSafeConfigLog(),
      });
      throw new Error(`Firebase setup failed: ${error.message}`);
    }
  }

  private validateConfig() {
    const requiredFields = ['apiKey', 'projectId', 'appId'];
    const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);

    if (missingFields.length > 0) {
      throw new Error(`Missing Firebase configuration: ${missingFields.join(', ')}`);
    }

    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'YOUR_API_KEY') {
      throw new Error('Invalid Firebase API key configuration');
    }
  }

  private getSafeConfigLog() {
    return {
      projectId: firebaseConfig.projectId,
      appId: firebaseConfig.appId,
      hasApiKey: !!firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_API_KEY',
      platform: Platform.OS,
    };
  }

  getInitializationStatus() {
    return this.isInitialized;
  }

  // Method to reinitialize if needed (e.g., after config update)
  reinitialize() {
    this.isInitialized = false;
    return this.initialize();
  }
}
