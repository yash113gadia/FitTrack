# FitTrack Build & Release Checklist

Use this checklist before every release to ensure quality and consistency.

## Pre-Build Checklist

### Version Management
- [ ] Update version number in `app.json` (e.g., `1.0.0` → `1.1.0`)
- [ ] Update iOS `buildNumber` in `app.json`
- [ ] Update Android `versionCode` in `app.json`
- [ ] Update changelog (`CHANGELOG.md`)
- [ ] Tag the release in git (`git tag v1.x.x`)

### Code Quality
- [ ] All tests passing (`npm test`)
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] Linting passes (`npm run lint`)
- [ ] Code review completed
- [ ] No console.log statements in production code

### Environment Configuration
- [ ] Verify API keys are correct for target environment
- [ ] Environment variables set in EAS secrets
- [ ] Gemini API key is valid
- [ ] Backend API URL is correct

### Feature Testing
- [ ] Test on iOS physical device
- [ ] Test on Android physical device
- [ ] Test on iOS simulator
- [ ] Test on Android emulator
- [ ] Test all navigation flows
- [ ] Test deep linking
- [ ] Test push notifications
- [ ] Test offline functionality
- [ ] Test barcode scanning
- [ ] Test AI food recognition
- [ ] Test food logging flow
- [ ] Test chatbot functionality

### Performance
- [ ] App startup time < 3 seconds
- [ ] Smooth scrolling (60fps)
- [ ] Memory usage within limits
- [ ] No memory leaks
- [ ] Database queries optimized
- [ ] Images optimized

### Security
- [ ] No sensitive data in logs
- [ ] API keys not exposed in code
- [ ] Secure storage for tokens
- [ ] Certificate pinning (if applicable)
- [ ] Input validation
- [ ] XSS protection

### Legal & Compliance
- [ ] Privacy policy updated (if needed)
- [ ] Terms of service updated (if needed)
- [ ] GDPR compliance verified
- [ ] CCPA compliance verified
- [ ] App permissions justified

---

## Build Commands

### Development Build
```bash
# iOS Simulator
eas build --profile development --platform ios

# Android APK
eas build --profile development --platform android

# Physical device (dev client)
eas build --profile development-device --platform all
```

### Preview Build (Internal Testing)
```bash
# Build for internal testers
eas build --profile preview --platform all

# Build specific platform
eas build --profile preview --platform ios
eas build --profile preview --platform android
```

### Production Build
```bash
# Build both platforms
eas build --profile production --platform all

# iOS App Store
eas build --profile production --platform ios

# Android Play Store (AAB)
eas build --profile production --platform android
```

---

## Submission Commands

### App Store (iOS)
```bash
# Submit to App Store Connect
eas submit --platform ios --latest

# Or specify a build ID
eas submit --platform ios --id [BUILD_ID]
```

### Play Store (Android)
```bash
# Submit to Play Console (internal track)
eas submit --platform android --latest

# Or specify a build ID
eas submit --platform android --id [BUILD_ID]
```

---

## Post-Release Checklist

### Monitoring
- [ ] Enable crash reporting monitoring
- [ ] Set up alerts for critical errors
- [ ] Monitor analytics for anomalies
- [ ] Check app store reviews

### Communication
- [ ] Notify team of release
- [ ] Update release notes in app stores
- [ ] Announce to beta testers (if applicable)
- [ ] Update documentation

### Rollback Plan
- [ ] Previous version available for rollback
- [ ] Rollback procedure documented
- [ ] Team aware of rollback process

---

## Code Signing Setup

### iOS
1. Create Apple Developer Account ($99/year)
2. Create App ID in Apple Developer Portal
3. Generate Distribution Certificate
4. Create Provisioning Profile (App Store)
5. Configure in EAS:
   ```bash
   eas credentials --platform ios
   ```

### Android
1. Generate upload keystore:
   ```bash
   keytool -genkey -v -keystore fittrack-upload.keystore \
     -alias fittrack -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Store keystore securely (never commit to git!)
3. Configure in EAS:
   ```bash
   eas credentials --platform android
   ```
4. Create Google Service Account for Play Console
5. Download JSON key and configure in `eas.json`

---

## EAS Secrets

Set these secrets in EAS dashboard or CLI:

```bash
# Set secrets
eas secret:create --name GEMINI_API_KEY --value "your-key"
eas secret:create --name SENTRY_DSN --value "your-dsn"

# List secrets
eas secret:list

# Delete a secret
eas secret:delete GEMINI_API_KEY
```

---

## Troubleshooting

### Common Issues

**Build fails with "Missing credentials"**
- Run `eas credentials` to configure signing

**iOS build fails with provisioning error**
- Check bundle identifier matches Apple Developer Portal
- Regenerate provisioning profile

**Android build fails with keystore error**
- Verify keystore password
- Check alias name

**OTA update not working**
- Verify `updates.url` in app.json
- Check channel configuration
- Verify native changes don't require new build

### Useful Commands
```bash
# Check EAS CLI version
eas --version

# View build logs
eas build:view

# List recent builds
eas build:list

# Cancel a build
eas build:cancel [BUILD_ID]

# Configure credentials
eas credentials
```

---

## Release Schedule

| Environment | Frequency | Day | Time |
|-------------|-----------|-----|------|
| Development | On commit | Daily | - |
| Preview | Weekly | Friday | 5 PM |
| Production | Bi-weekly | Tuesday | 10 AM |

---

## Version Naming Convention

- **Major (X.0.0)**: Breaking changes, major features
- **Minor (0.X.0)**: New features, backward compatible
- **Patch (0.0.X)**: Bug fixes, small improvements

Example: `1.2.3`
- 1 = Major version
- 2 = Minor version (feature releases)
- 3 = Patch version (bug fixes)
