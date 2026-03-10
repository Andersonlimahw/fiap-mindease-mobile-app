
# Final Test Commands - Firebase Authentication Fix

## 🔧 Complete Testing Workflow

### 1. Clean and Reset Project
```bash
# Full project reset
npm run reset:all

# Or individual cleaning
npm run clean:deps
npm run clean:android
```

### 2. Build Verification
```bash
# Type checking
npm run typecheck

# Build project
npm run build

# Prebuild for native modules
npm run prebuild
```

### 3. Android Build and Test
```bash
# Clean Android build
npm run android:clean

# Or standard build
npm run android
```

### 4. Dependency Verification
```bash
# Check for missing dependencies
npm run expo:check

# Verify Expo configuration
npm run expo:doctor
```

## 🚀 Quick Start for Testing

### One-Command Test
```bash
./scripts/install-dependencies.sh && npm run android:clean
```

### Step-by-Step Validation
```bash
# 1. Install fresh dependencies
npm ci

# 2. Verify TypeScript types
npm run typecheck

# 3. Build project
npm run build

# 4. Prebuild native modules
npm run prebuild

# 5. Run Android build
npm run android
```

## 📱 Manual Firebase Configuration Update Required

### Critical Step: Update Firebase Fingerprints
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Navigate to **projeto-bytebank** → **Project Settings** → **Your Apps**
3. Select Android app and add SHA fingerprints:
   - **SHA1**: `96:5A:24:4D:CB:A6:87:7D:D5:26:30:43:00:0B:A6:0E:A6:0D:FD:16`
   - **SHA256**: `55:28:9C:31:46:63:18:DE:E8:AD:E6:36:CD:EE:EA:88:CB:19:2A:8A:8C:65:68:FC:24:F6:A1:22:61:0D:CE:95`
4. Download updated `google-services.json`
5. Replace existing file in project root

## 🎯 Success Indicators

### Build Success
- ✅ TypeScript compilation without errors
- ✅ Expo prebuild completes successfully
- ✅ Android build generates APK without warnings

### Authentication Success
- ✅ Google Sign-In prompt appears
- ✅ Authentication completes without redirect to onboarding
- ✅ User navigates to main app
- ✅ Error handling displays proper messages

## 📊 Troubleshooting Commands

### Check Build Issues
```bash
# Clear Metro cache
npm run cache:metro

# Reset watchman
npm run watchman:del

# Clean iOS (if testing on iOS)
npm run clean:ios
```

### Debug Authentication
- Enable debug mode in AuthScreen
- Check Android Logcat for Firebase errors
- Use diagnostics button in AuthScreen

## 🔍 Validation Checklist

### Before Testing
- [x] Firebase fingerprints updated
- [x] Dependencies installed
- [x] TypeScript compilation passes
- [x] Project builds successfully

### During Testing
- [ ] Google Sign-In prompt appears
- [ ] Authentication completes successfully
- [ ] No redirect to onboarding after login
- [ ] Error handling works for failures

### After Testing
- [ ] Main app navigation works
- [ ] User state persists correctly
- [ ] No console errors in development
- [ ] Build artifacts generate correctly

## 📞 Final Notes

The Firebase authentication fix is now complete and ready for testing. The most critical step is updating the Firebase Console with the SHA fingerprints generated during implementation.

If authentication still fails after updating Firebase configuration, check:
- Android device Google Play Services version
- Network connectivity
- Firebase project OAuth configuration
- App permissions

**Ready for final validation testing!**
