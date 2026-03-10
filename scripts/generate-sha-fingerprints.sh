
#!/bin/bash

echo "=== Generating SHA Fingerprints for Firebase Configuration ==="

# Debug keystore (default Android debug keystore)
echo ""
echo "1. Debug Keystore SHA Fingerprints:"
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android 2>/dev/null | grep -E "(SHA1|SHA256)"

# Check if release keystore exists
if [ -f "android/app/mindease-release.keystore" ]; then
    echo ""
    echo "2. Release Keystore SHA Fingerprints:"
    keytool -list -v -keystore android/app/mindease-release.keystore -alias mindease -storepass [YOUR_STORE_PASSWORD] -keypass [YOUR_KEY_PASSWORD] 2>/dev/null | grep -E "(SHA1|SHA256)" || echo "Please replace [YOUR_STORE_PASSWORD] and [YOUR_KEY_PASSWORD] with actual values"
else
    echo ""
    echo "2. Release Keystore: Not found. Create one with:"
    echo "   keytool -genkey -v -keystore android/app/mindease-release.keystore -alias mindease -keyalg RSA -keysize 2048 -validity 10000"
fi

echo ""
echo "=== Instructions ==="
echo "1. Copy the SHA1 and SHA256 fingerprints above"
echo "2. Go to Firebase Console → Project Settings → Your Apps → Android App"
echo "3. Add the fingerprints to your Firebase Android app configuration"
echo "4. Download the updated google-services.json"
echo "5. Replace the existing file in the project root"
