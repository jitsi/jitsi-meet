# GraceTech Jitsi Meet SDK

## Read CUSTOMIZATION.md first if you are doing customization work in jitsi-meet UI
### Make sure you are following the principles and guidelines in your customizastion work

## Instructions

### 1. Create new SDK version

#### 1.1 Prepare
The following steps need to be done only once.：
1. Clone [gracetech-services/gt-jitsisdk](https://github.com/gracetech-services/gt-jitsisdk) Repo
2. Get the local path directory of the above Repo, which will be used in subsequent steps.

#### 1.2 Create

1. Navigate to the repo root (not `react-native-sdk/`)
2. (Optional) Run `git switch <branch name>` to switch to the desired branch from which to create the new version
3. Update version in `react-native-sdk/package.json` if not updated already
4. Run the fishmeet SDK build script from the repo root:
   ```
   ./build.fishmeet-rnsdk.sh --pack-destination <path to gt-jitsisdk>/packages/
   ```
   This script applies the fishmeet SVG overrides (from `fishmeet/react/`) to the
   source tree first, then runs `npm pack`. This is necessary because `prepare_sdk.js`
   bundles the contents of `react/` directly into the package.

5. Rename the created `.tgz` file if desired and commit the file to GitHub

Note: Only commit updated version in `package.json`, do not commit any other changes in this repo when creating a new SDK version.

#### 1.3 Fishmeet override strategy

The Fishmeet UI customizations live under `fishmeet/` to minimize changes to the
upstream Jitsi source tree:

- `fishmeet/react/features/base/icons/svg/` — custom SVG icons that replace the
  corresponding Jitsi originals at build time (e.g. `hangup.svg`, `mic.svg`).
  `build.fishmeet-rnsdk.sh` copies these into `react/features/base/icons/svg/`
  before packing, so the bundled SDK contains the Fishmeet icons.

- `fishmeet/css/` — SCSS overlay files for the **web** build only. Applied by
  `build.fishmeet.sh` (web) and `dev.sh` (dev server). Not needed for the RN SDK.

### 2. Use new SDK version in app

1. Update `@jitsi/react-native-sdk` dependency in app `package.json` with the raw GitHub link to the desired `.tgz` file. Make sure the link references the file from a specific commit and does not reference a branch. For example: `https://github.com/gracetech-services/gt-jitsisdk/raw/314835fb95090505b4c24d422634eb85b988a086/packages/jitsi-react-native-sdk-0.0.0.tgz`

### 3. Update Jitsi SDK for new Expo SDK version

#### 3.1 Update Expo SDK
1. In repo root, Run `npm install -D expo` to install Expo temporarily
2. Run `npx expo install --fix` to fix React Native SDK peer dependency versions. Note: Updating `@types/*` or `typescript` packages may cause typing errors, do not update these packages if desired
3. Run `npx expo-doctor` and fix issues
4. Run `npm uninstall expo` to remove Expo

#### 3.2 Update RNSDK dependencies
1. Navigate to `react-native-sdk` directory in this repo, Run `node update_sdk_dependencies.js`
2. Follow instructions above (1. Create new SDK version) to create new Jitsi SDK version

### 4. How to Test generate sdk

Refer gracetech-services/iMeet README.md:
https://github.com/gracetech-services/iMeet/blob/fcd76aa406140671b6e031f0d43640d3446d9935/README.md
