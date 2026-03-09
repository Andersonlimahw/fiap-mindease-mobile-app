import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import Constants from "expo-constants";
import type { AuthRepository } from "@domain/repositories/AuthRepository";
import type { User } from "@domain/entities/User";
import type { AuthProvider } from "@domain/entities/AuthProvider";

function mapFirebaseUser(firebaseUser: FirebaseAuthTypes.User | null): User | null {
  if (!firebaseUser) return null;
  return {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || "User",
    email: firebaseUser.email || undefined,
    photoUrl: firebaseUser.photoURL || undefined,
  };
}

export class FirebaseAuthRepository implements AuthRepository {
  constructor() {
    const extra = (Constants.expoConfig?.extra ?? {}) as Record<
      string,
      string | undefined
    >;
    try {
      GoogleSignin.configure({
        webClientId: extra.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        iosClientId: extra.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        offlineAccess: false,
      });
    } catch (e) {
      console.error("[FirebaseAuthRepository] GoogleSignin configure error", e);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    return mapFirebaseUser(auth().currentUser);
  }

  onAuthStateChanged(cb: (user: User | null) => void): () => void {
    return auth().onAuthStateChanged((user) => {
      cb(mapFirebaseUser(user));
    });
  }

  async signIn(
    provider: AuthProvider,
    options?: { email?: string; password?: string }
  ): Promise<User> {
    if (provider === "google") {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const { data } = await GoogleSignin.signIn();
      const idToken = data?.idToken;
      
      if (!idToken) {
        throw new Error("Google Sign-In failed: No ID Token found");
      }

      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const userCredential = await auth().signInWithCredential(googleCredential);
      
      const user = mapFirebaseUser(userCredential.user);
      if (!user) throw new Error("Firebase sign-in with Google failed");
      return user;
    }

    if (provider === "password") {
      if (!options?.email || !options?.password) {
        throw new Error("Email and password are required");
      }
      const userCredential = await auth().signInWithEmailAndPassword(
        options.email,
        options.password
      );
      const user = mapFirebaseUser(userCredential.user);
      if (!user) throw new Error("Firebase sign-in with email failed");
      return user;
    }

    if (provider === "anonymous") {
      const userCredential = await auth().signInAnonymously();
      const user = mapFirebaseUser(userCredential.user);
      if (!user) throw new Error("Firebase anonymous sign-in failed");
      return user;
    }

    throw new Error(`Provider ${provider} not supported`);
  }

  async signUp(options: { email: string; password: string }): Promise<User> {
    const userCredential = await auth().createUserWithEmailAndPassword(
      options.email,
      options.password
    );
    const user = mapFirebaseUser(userCredential.user);
    if (!user) throw new Error("Firebase sign-up failed");
    return user;
  }

  async signOut(): Promise<void> {
    try {
      if (await GoogleSignin.isSignedIn()) {
        await GoogleSignin.signOut();
      }
    } catch (e) {
      console.warn("[FirebaseAuthRepository] Google signOut error", e);
    }
    await auth().signOut();
  }
}
