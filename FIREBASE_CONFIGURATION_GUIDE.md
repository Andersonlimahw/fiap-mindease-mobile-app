
# Firebase & Google Console Configuration Guide

## Prerequisites
- Android Studio installed
- Java JDK installed
- Firebase project created
- Google Cloud Console access

## Step 1: Generate SHA Certificates

### Debug Keystore (Development)
```bash
# Navigate to Android SDK directory
cd ~/.android/

# Generate SHA-1 fingerprint
keytool -list -v -keystore debug.keystore -alias androiddebugkey -storepass android -keypass android

# Expected output format:
# SHA1: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
# SHA256: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
```

### Release Keystore (Production)
```bash
# If you have a release keystore
keytool -list -v -keystore mindease-release.keystore -alias mindease
```

## Step 2: Firebase Console Configuration

### 1. Access Firebase Console
- Go to [Firebase Console](https://console.firebase.google.com)
- Select your project: `mindease-mobile-app`

### 2. Android App Configuration
- Navigate to **Project Settings** → **Your Apps**
- Click **Add App** → **Android**
- **Android package name**: `com.mindease`
- **App nickname**: `MindEase Android`
- **Debug signing certificate SHA-1**: Paste from Step 1
- **Debug signing certificate SHA-256**: Paste from Step 1
- Download `google-services.json`

### 3. Replace Configuration Files
```bash
# Replace the existing google-services.json
cp ~/Downloads/google-services.json /Users/andersonlimadev/Projects/mobile/mindease/fiap-mindease-mobile-app/android/app/
```

## Step 3: Google Cloud Console Configuration

### 1. Access Google Cloud Console
- Go to [Google Cloud Console](https://console.cloud.google.com)
- Select project: `mindease-mobile-app`

### 2. OAuth Consent Screen
- Navigate to **APIs & Services** → **OAuth consent screen**
- **User Type**: External or Internal (depending on your needs)
- **App name**: `MindEase Mobile`
- **User support email**: Your email
- **Developer contact information**: Your email
- **Scopes**: Add `email`, `profile`, `openid`

### 3. OAuth 2.0 Client IDs
- Navigate to **APIs & Services** → **Credentials**
- Find your Android OAuth client
- Verify:
  - **Name**: Android client for MindEase
  - **Package name**: `com.mindease`
  - **SHA-1 fingerprint**: Should match Step 1
- If incorrect, create new OAuth client ID:
  - **Application type**: Android
  - **Name**: `MindEase Android`
  - **Package name**: `com.mindease`
  - **SHA-1 fingerprint**: From Step 1

## Step 4: Android Configuration Verification

### 1. Build Gradle Check
Verify `android/app/build.gradle` contains:
```gradle
apply plugin: 'com.google.gms.google-services'

dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-auth'
}
```

### 2. Project Gradle Check
Verify `android/build.gradle` contains:
```gradle
dependencies {
    classpath 'com.google.gms:google-services:4.3.15'
}
```

### 3. AndroidManifest.xml Check
Verify contains:
```xml
<meta-data
    android:name="com.google.android.gms.version"
    android:value="@integer/google_play_services_version" />
```

## Step 5: Code-Level Enhancements

### Enhanced Auth Service with Better Error Handling
The current implementation needs improved error handling. Key improvements:

1. **Better error logging** for debugging
2. **Retry mechanisms** for network issues
3. **User-friendly error messages**
4. **Network connectivity checks**

### Testing Commands
```bash
# Clean and rebuild
cd android
./gradlew clean
./gradlew assembleDebug

# Test on device
adb install app/build/outputs/apk/debug/app-debug.apk
```

## Step 6: Validation Tests

### Test Scenarios
1. **Fresh Install** → Google Sign-In → Should navigate to main app
2. **Existing User** → Should skip onboarding
3. **Network Issues** → Should show proper error message
4. **Invalid Credentials** → Should handle gracefully

### Debugging Tips
- Check Android Logcat for authentication errors
- Verify network connectivity
- Test with different Google accounts
- Clear app data between tests

## Common Issues and Solutions

### Issue: "Redirected to onboarding after login"
- **Cause**: Missing or incorrect SHA certificates
- **Solution**: Regenerate and update Firebase configuration

### Issue: "App not registered"
- **Cause**: Package name mismatch
- **Solution**: Verify package name in Firebase and AndroidManifest.xml

### Issue: "Network error"
- **Cause**: Internet connectivity or firewall
- **Solution**: Check network settings and retry

## Final Checklist
- [ ] SHA certificates generated and added to Firebase
- [ ] `google-services.json` updated in project
- [ ] OAuth consent screen configured
- [ ] Android OAuth client verified
- [ ] Code enhancements implemented
- [ ] Testing completed successfully

## Support Resources
- [Firebase Android Setup Guide](https://firebase.google.com/docs/android/setup)
- [Google Sign-In for Android](https://developers.google.com/identity/sign-in/android)
- [Firebase Authentication Troubleshooting](https://firebase.google.com/docs/auth/android/troubleshooting)
