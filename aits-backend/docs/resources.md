# AITS Asset & Resource Management Rules

This document specifies the asset separation rules between the **Next.js Web Application** (`aits-frontend`) and the **React Native / Expo Mobile Application** (`aits-mobile`).

---

## 1. Strict Asset Separation Rule

- **No Shared Visual Assets**: Visual assets (logos, icons, web illustrations, mobile splash screens, fonts) MUST NOT be shared in a shared root folder.
- **Web Resources**: Reside exclusively within `aits-frontend/public/assets/` and `aits-frontend/src/assets/`.
- **Mobile Resources**: Reside exclusively within `aits-mobile/assets/` and `aits-mobile/src/assets/`.

---

## 2. Directory Hierarchy

### Web Application (`aits-frontend/`)
```
public/assets/
├── images/
│   ├── animals/
│   ├── farms/
│   ├── users/
│   └── dashboard/
├── icons/
├── logos/
├── illustrations/
├── backgrounds/
├── placeholders/
├── qr/
└── documents/

src/assets/
├── images/
├── icons/
├── illustrations/
└── fonts/
```

### Mobile Application (`aits-mobile/`)
```
assets/
├── images/
│   ├── animals/
│   ├── farms/
│   ├── users/
│   └── onboarding/
├── icons/
├── logos/
├── illustrations/
├── backgrounds/
├── placeholders/
├── animations/
├── sounds/
└── fonts/

src/assets/
├── images/
├── icons/
├── illustrations/
└── fonts/
```

---

## 3. Naming Standard (Kebab-Case)

All filenames must strictly use lowercase **kebab-case**:

- ✅ `assets/images/animal-placeholder.png`
- ✅ `assets/icons/health-status.svg`
- ❌ `Animal Image Final.png`
- ❌ `dashboardIMAGE.png`
