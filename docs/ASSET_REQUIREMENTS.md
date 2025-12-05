# FitTrack - Asset Requirements for Designers

## Brand Guidelines

### Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Primary Blue | #007bff | 0, 123, 255 | Main brand, CTAs |
| Success Green | #00c853 | 0, 200, 83 | Goals met, positive |
| Warning Yellow | #ffc107 | 255, 193, 7 | Warnings, attention |
| Error Red | #f44336 | 244, 67, 54 | Errors, over limits |
| Gray 900 | #111827 | 17, 24, 39 | Text primary |
| Gray 500 | #6b7280 | 107, 114, 128 | Text secondary |
| White | #ffffff | 255, 255, 255 | Backgrounds |

### Macro Colors

| Macro | Hex | Usage |
|-------|-----|-------|
| Calories | #FF6B6B | Calorie indicators |
| Protein | #4ECDC4 | Protein tracking |
| Fats | #FFE66D | Fat tracking |
| Carbs | #95E1D3 | Carb tracking |

### Typography

| Style | Font | Weight | Size |
|-------|------|--------|------|
| H1 | System | Bold | 32px |
| H2 | System | Semibold | 24px |
| H3 | System | Semibold | 20px |
| Body | System | Regular | 16px |
| Caption | System | Regular | 14px |

---

## App Icons

### iOS App Icon

| Size | Pixels | Use Case |
|------|--------|----------|
| App Store | 1024 x 1024 | App Store Connect |
| iPhone | 180 x 180 | @3x devices |
| iPhone | 120 x 120 | @2x devices |
| iPad | 167 x 167 | iPad Pro |
| iPad | 152 x 152 | iPad, iPad mini |
| Settings | 87 x 87 | @3x Settings |
| Spotlight | 120 x 120 | @3x Spotlight |
| Notifications | 60 x 60 | @3x Notifications |

**Requirements:**
- No transparency (no alpha channel)
- No rounded corners (iOS applies automatically)
- PNG format
- sRGB color space

### Android App Icon

| Type | Size | Notes |
|------|------|-------|
| Play Store | 512 x 512 | PNG, 32-bit with alpha |
| Adaptive Foreground | 432 x 432 | Safe zone: 264x264 center |
| Adaptive Background | 432 x 432 | Can be solid color |
| Legacy | 192 x 192 | Fallback for older devices |

**Adaptive Icon Notes:**
- Foreground: Main icon artwork
- Background: #007bff (Primary Blue)
- Keep important content in center 66%
- System applies various masks (circle, squircle, etc.)

---

## Screenshots

### iOS Screenshots

#### iPhone 6.7" (iPhone 15 Pro Max)
- **Size**: 1290 x 2796 px
- **Format**: PNG or JPEG
- **Count**: 2-10 screenshots

#### iPhone 6.5" (iPhone 11 Pro Max)
- **Size**: 1284 x 2778 px
- **Format**: PNG or JPEG
- **Count**: 2-10 screenshots

#### iPhone 5.5" (iPhone 8 Plus)
- **Size**: 1242 x 2208 px
- **Format**: PNG or JPEG
- **Count**: 2-10 screenshots

#### iPad Pro 12.9" (3rd gen+)
- **Size**: 2048 x 2732 px
- **Format**: PNG or JPEG
- **Count**: 2-10 screenshots

### Android Screenshots

#### Phone
- **Size**: 1080 x 1920 px minimum (16:9)
- **Recommended**: 1440 x 2560 px
- **Format**: PNG or JPEG
- **Count**: 2-8 screenshots

#### 7-inch Tablet
- **Size**: 1200 x 1920 px minimum
- **Format**: PNG or JPEG
- **Count**: 1-8 screenshots

#### 10-inch Tablet
- **Size**: 1800 x 2560 px minimum
- **Format**: PNG or JPEG
- **Count**: 1-8 screenshots

### Screenshot Content Plan

| # | Screen | Key Elements | Caption |
|---|--------|--------------|---------|
| 1 | Dashboard | Macro rings, today's progress | "Track your daily macros at a glance" |
| 2 | Food Log | AI photo recognition | "Snap a photo to instantly log meals" |
| 3 | Barcode | Scanner in action | "Scan barcodes for instant nutrition info" |
| 4 | AI Chat | Chatbot conversation | "Get personalized nutrition advice 24/7" |
| 5 | Analytics | Progress charts | "Visualize your progress over time" |
| 6 | Streaks | Calendar with streak | "Build healthy habits with streak tracking" |

### Screenshot Design Guidelines

1. **Device Frame**: Optional, but adds polish
2. **Caption**: 2-4 words, centered above or below
3. **Background**: Solid color or subtle gradient
4. **Focal Point**: Highlight key feature
5. **Consistency**: Same style across all screenshots
6. **Text**: Large enough to read on store listing

---

## Feature Graphic (Android)

| Specification | Value |
|---------------|-------|
| Size | 1024 x 500 px |
| Format | PNG or JPEG (24-bit, no alpha) |

### Design Elements:
- FitTrack logo (left side)
- Tagline: "Track Smarter. Eat Better."
- 2-3 feature icons
- Brand colors
- No excessive text

---

## Notification Icon (Android)

| Specification | Value |
|---------------|-------|
| Size | 96 x 96 px (xxxhdpi) |
| Format | PNG with alpha |
| Colors | White silhouette only |

**Note**: Android notification icons must be:
- Single color (white)
- Transparent background
- Simple, recognizable shape

---

## Splash Screen

### iOS Launch Screen
- Use launch storyboard (configured in Expo)
- Background: #007bff (Primary Blue)
- Center: FitTrack logo (white)

### Android Splash
- Background: #007bff
- Center: FitTrack logo
- Size: 288 x 288 dp (center)

---

## Marketing Materials

### App Preview Video (iOS)
| Device | Resolution | Duration |
|--------|------------|----------|
| iPhone 6.7" | 1290 x 2796 | 15-30 sec |
| iPhone 6.5" | 886 x 1920 | 15-30 sec |
| iPad | 1200 x 1600 | 15-30 sec |

**Requirements:**
- No device frames
- 30 fps
- H.264 codec
- No letterboxing

### Promo Video (Android)
| Specification | Value |
|---------------|-------|
| Platform | YouTube |
| Aspect | 16:9 landscape |
| Duration | 30 sec - 2 min |
| Quality | 1080p minimum |

---

## Social Media Assets

### Twitter/X
| Asset | Size |
|-------|------|
| Profile | 400 x 400 px |
| Header | 1500 x 500 px |
| Post | 1200 x 675 px |

### Instagram
| Asset | Size |
|-------|------|
| Profile | 320 x 320 px |
| Post (Square) | 1080 x 1080 px |
| Story | 1080 x 1920 px |

### Facebook
| Asset | Size |
|-------|------|
| Profile | 170 x 170 px |
| Cover | 820 x 312 px |
| Post | 1200 x 630 px |

---

## Asset Delivery Checklist

### App Icons
- [ ] iOS App Store (1024x1024)
- [ ] iOS device sizes (all @1x, @2x, @3x)
- [ ] Android Play Store (512x512)
- [ ] Android Adaptive (foreground + background)
- [ ] Android Legacy (192x192)
- [ ] Android Notification (96x96, white)

### Screenshots
- [ ] iPhone 6.7" (6 screenshots)
- [ ] iPhone 6.5" (6 screenshots)
- [ ] iPhone 5.5" (6 screenshots)
- [ ] iPad 12.9" (6 screenshots)
- [ ] Android Phone (6 screenshots)
- [ ] Android 7" Tablet (6 screenshots)
- [ ] Android 10" Tablet (6 screenshots)

### Marketing
- [ ] Feature Graphic (1024x500)
- [ ] App Preview Video (iOS)
- [ ] Promo Video (Android/YouTube)
- [ ] Social media kit

### Source Files
- [ ] Figma/Sketch source files
- [ ] Logo in SVG format
- [ ] Icon in SVG format
- [ ] Color palette file
- [ ] Font files (if custom)

---

## File Organization

```
assets/
├── icons/
│   ├── ios/
│   │   ├── icon-1024.png
│   │   ├── icon-180.png
│   │   └── ...
│   └── android/
│       ├── play-store-512.png
│       ├── adaptive-foreground.png
│       ├── adaptive-background.png
│       └── notification-icon.png
├── screenshots/
│   ├── ios/
│   │   ├── 6.7-inch/
│   │   ├── 6.5-inch/
│   │   ├── 5.5-inch/
│   │   └── ipad-12.9/
│   └── android/
│       ├── phone/
│       ├── tablet-7/
│       └── tablet-10/
├── marketing/
│   ├── feature-graphic.png
│   ├── app-preview-video.mp4
│   └── promo-video.mp4
├── splash/
│   ├── splash.png
│   └── splash-icon.png
└── social/
    ├── twitter/
    ├── instagram/
    └── facebook/
```
