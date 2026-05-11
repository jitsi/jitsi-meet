# Publishing Jitsi Meet Android SDK to GitHub Packages

This repository is configured to publish the Jitsi Meet Android SDK and its associated React Native modules to GitHub Packages.

## Prerequisites

1. A GitHub Personal Access Token (PAT) with `read:packages` and `write:packages` scopes.
2. The repository must be hosted on GitHub.

## How to Publish

### Automated Publishing (Recommended)

1. Update the version in `android/gradle.properties` (optional, as tags override it).
2. Create and push a Git tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. The GitHub Action "Publish Android SDK" will automatically build and publish the SDK to GitHub Packages.

### Local Publishing

1. Create a `local.properties` file in the `android/` directory (if not already there).
2. Add your GitHub credentials:
   ```properties
   gpr.user=YOUR_GITHUB_USERNAME
   gpr.key=YOUR_GITHUB_PAT
   ```
3. Update `GITHUB_REPOSITORY` in `android/gradle.properties`.
4. Run the publish command:
   ```bash
   cd android
   ./gradlew publish
   ```

---

## How to Consume the SDK

To use this SDK in another Android project, follow these steps:

### 1. Configure Repositories

In your **root** `settings.gradle` (or `build.gradle`), add the GitHub Packages repository:

```gradle
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        maven {
            url = uri("https://maven.pkg.github.com/USERNAME/REPOSITORY")
            credentials {
                username = System.getenv("GITHUB_ACTOR") ?: "YOUR_GITHUB_USERNAME"
                password = System.getenv("GITHUB_TOKEN") ?: "YOUR_GITHUB_PAT"
            }
        }
        maven { url 'https://www.jitpack.io' }
    }
}
```

### 2. Add Dependency

In your **app** `build.gradle`:

```gradle
dependencies {
    implementation("com.mycompany.jitsi:custom-jitsi-sdk:1.0.0")
}
```

### 3. Handle Transitive Dependencies

Since Jitsi Meet depends on many React Native modules, you may need to ensure your project can handle:
- **Java 17+** (Required by Jitsi SDK)
- **Minimum SDK 26**
- **ABI Filters**: Jitsi includes native libs for `armeabi-v7a`, `arm64-v8a`, `x86`, and `x86_64`.

Example `app/build.gradle` config:
```gradle
android {
    defaultConfig {
        minSdk 26
        ndk {
            abiFilters "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}
```

## Troubleshooting

### Duplicate Classes
If you encounter duplicate class errors, it's usually because your app already includes some of the same libraries as Jitsi. Use `./gradlew :app:dependencies` to identify conflicts and exclude them if necessary.

### Missing Native Libs
Ensure you have `android.extractNativeLibs=true` in your `gradle.properties` if you face issues with JNI.

### GitHub Packages Authentication
GitHub Packages **always** requires authentication, even for public packages. Ensure your `GITHUB_TOKEN` or PAT is correctly configured in your build script.
