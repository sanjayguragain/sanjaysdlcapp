---
name: sce-mobile-security-auditor
description: 'Assess mobile app security for iOS, Android, React Native, Flutter, and Xamarin. Reviews secure storage, networking, code obfuscation, and runtime protection. Use when auditing mobile applications for security vulnerabilities. Returns mobile security assessment report.'
compatibility:
- claude-code
- codex
- amp
- opencode
metadata:
  version: 1.0.0
  author: SDLC Security Team
  tags:
  - security
  - mobile-security
  - ios
  - android
  - react-native
  - flutter
  - xamarin
  tools: Bash Read Grep
  category: Security & Compliance
---

# Mobile Security Auditor Skill

Assesses security of iOS, Android, and cross-platform mobile applications.

## When to Use This Skill

- Auditing iOS app security
- Reviewing Android app security
- Checking React Native security
- Validating Flutter app security
- Assessing Xamarin security
- Reviewing secure storage implementations
- Checking network security (certificate pinning)
- Validating code obfuscation and anti-tampering
- Reviewing mobile-specific permissions

## Unitary Function

**ONE RESPONSIBILITY:** Assess mobile application security (storage, networking, obfuscation, runtime)

**NOT RESPONSIBLE FOR:**
- Backend API security (see sce-api-security-reviewer)
- Web infrastructure (see sce-web-infrastructure-auditor)
- General vulnerability scanning (see sce-vulnerability-scanner)
- Compliance validation (see sce-compliance-checker)
- Fixing mobile security issues (read-only skill)

## Input

- **app_path**: Path to mobile app source code or binary
- **platform**: ios, android, react-native, flutter, xamarin
- **app_type**: Optional (source, binary, both)

## Output

Mobile security report (JSON format):

```json
{
  "audit_id": "uuid",
  "timestamp": "ISO-8601",
  "platform": "iOS|Android|React Native|Flutter|Xamarin",
  "risk_score": "Critical|High|Medium|Low",
  "findings": {
    "secure_storage": [
      {
        "severity": "High",
        "issue": "Sensitive data stored in SharedPreferences without encryption",
        "location": "MainActivity.java:156",
        "remediation": "Use Android Keystore for sensitive data"
      }
    ],
    "network_security": [],
    "code_obfuscation": [],
    "runtime_protection": [],
    "permissions": [],
    "binary_protection": [],
    "third_party_libraries": []
  },
  "recommendations": []
}
```

## Mobile Security Areas Reviewed

### Storage Security
- Keychain/Keystore usage
- SharedPreferences/UserDefaults encryption
- Database encryption (SQLite, Realm)
- File storage permissions
- Cache security

### Network Security
- HTTPS enforcement
- Certificate pinning
- Certificate validation
- Network security configuration
- WebView security

### Code Protection
- Code obfuscation (ProGuard, R8, SwiftShield)
- Anti-tampering mechanisms
- Root/jailbreak detection
- Debugger detection
- Reverse engineering protection

### Runtime Security
- Dynamic code loading
- WebView configuration
- Deep link validation
- Intent handling (Android)
- URL scheme handling (iOS)

### Permissions
- Minimum required permissions
- Runtime permission handling
- Privacy-sensitive permissions
- Background location usage

## Platform-Specific Checks

### iOS
- Keychain configuration
- App Transport Security (ATS)
- Info.plist security settings
- Code signing
- Swift/Objective-C security patterns

### Android
- Android Keystore
- Network Security Config
- AndroidManifest.xml permissions
- ProGuard/R8 configuration
- Java/Kotlin security patterns

### Cross-Platform (React Native, Flutter, Xamarin)
- Bridge/channel security
- Native module security
- JavaScript/Dart code protection
- Platform-specific implementations

## Usage Example

```bash
# Android app audit
python scripts/mobile_security_auditor.py --path app/android --platform android --output report.json

# iOS app audit
python scripts/mobile_security_auditor.py --path app/ios --platform ios --output report.json

# React Native audit
python scripts/mobile_security_auditor.py --path . --platform react-native --output report.json
```

## Helper Scripts

- `mobile_security_auditor.py`: Main mobile security auditor
- `android_analyzer.py`: Android-specific checks
- `ios_analyzer.py`: iOS-specific checks
- `cross_platform_analyzer.py`: React Native, Flutter, Xamarin checks

## Risk Scoring

- **Critical**: Hardcoded secrets, no certificate pinning for sensitive data
- **High**: Insecure storage, weak obfuscation, excessive permissions
- **Medium**: Missing root detection, weak certificate validation
- **Low**: Minor permission improvements, documentation gaps

## Safety Rules

1. **Read-only**: Never modifies mobile app code or binaries
2. **No secrets in logs**: Redacts API keys and sensitive data from reports
3. **Scope focus**: Reports only on mobile security, not backend APIs
