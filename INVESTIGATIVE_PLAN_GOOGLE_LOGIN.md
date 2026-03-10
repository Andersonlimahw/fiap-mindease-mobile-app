# Investigative Plan - Google Login Failure on Android

## Current Status
- **iOS:** Working normally.
- **Android:** Redirects to onboarding/login after attempt (failure).
- **Environment:** Physical Android device.

## Identified Root Causes
1. **Misconfigured `webClientId`**: `GoogleSignin.configure` in `FirebaseAuthRepository.ts` attempts to read `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` from `expoConfig.extra`, but it's not defined in `app.json`.
2. **Incorrect Client ID in `GoogleAuthService`**: Hardcoded `webClientId` is actually an Android Client ID (`client_type: 1`), not a Web Client ID (`client_type: 3`), which is required for Android.
3. **Mismatched Package Name**: `google-services.json` contains references to `com.bytebankapp.android` instead of the current `com.mindease.android` in the OAuth client section.
4. **SHA-1 Fingerprint**: Reusing credentials from another app usually means the SHA-1 fingerprint of the current developer environment/signing key is not registered for the new package name in Firebase.

## Proposed Fixes
1. Update `google-services.json` to ensure the package name matches `com.mindease.android` everywhere.
2. Update `app.json` to include `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` in the `extra` section.
3. Refactor `GoogleAuthService` to use the same configuration source as `FirebaseAuthRepository`.
4. Create a comprehensive guide for the user to:
   - Extract the SHA-1 from their physical device/development environment.
   - Register the Android app in Firebase Console with the correct package name.
   - Add the SHA-1 fingerprints (Debug and Release).
   - Download and replace `google-services.json`.

## Documentation
A new file `DOCS_ANDROID_GOOGLE_LOGIN_FIX.md` will be created with the step-by-step instructions.
