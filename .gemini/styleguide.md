# Fishmeet Code Review Style Guide

## 1. Architecture & Override Enforcement
* **No Direct Core Edits**: Flag any manual modifications to files in the `react/` or `css/` directories unless they fall under the specific "Extension Point" exceptions.
* **Placement Rule**: All fishmeet-specific customizations must be located within the `fishmeet/` directory.
* **Rsync Compatibility**: Ensure new files in `fishmeet/react/` mirror the exact directory structure of the core `react/` tree to ensure the `rsync` overlay works correctly.  Please see dev.sh, build.fishmeet.sh, and build.fishmeet-rnsdk.sh for reference on how rsync overlay is done for dev and build process.

## 2. Permitted Core Extensions
If a developer *must* edit a core file, it must strictly follow these patterns:
* **Optional Style Props**: Modifications should only add optional style properties to core components (e.g., `styles.buttonTypeConfig`, `styles.switchProps`, `styles.sendButtonProps`).
* **The "As Any" Pattern**: Verify that core files read these properties using the `(styles as any).propName` pattern to maintain upstream compatibility.
* **No Brand Logic**: Reject any PR that introduces `if (appType.isFishMeet)` or similar brand-specific branching inside core files.

## 3. Styling & Branding
* **Token Usage**: Reject hardcoded hex colors. All branding must use `BaseTheme.palette.fishMeet*` tokens defined in `Tokens.ts`.
* **Mandatory Annotations**: When a stylesheet is overridden in `fishmeet/react/`, every changed property must be annotated with `// fishmeet: was <original value>` for upgrade tracking.
* **Icon Replacements**: Custom icons must be placed in `fishmeet/react/features/base/icons/svg/`.

## 4. Maintenance & Liability
* **TSX Overrides**: Flag the creation of new `.tsx` overrides in `fishmeet/react/` as a "Maintenance Liability." Ask the author if the change can be achieved via a stylesheet override or a small core extension point instead.  Because the react-native support for stylesheet is much more limited, tsx override are occassionally necessary, but please justify and keep it minimum.
* **Config Management**: Server-controlled flags should be added to `config.js` and `configType.ts` rather than hardcoded into components.
* ** fishmeet-config.js is where you should put your customization values. Jitsi's core config files are config.js and configType.js. It's ok to add new config variables in these files for type-checking purpose, but the final value should always be in fishmeet-config.js.  There are exceptions: if these values are to be used by the mobile client, then putting them in config.js is the right way, because mobile sdk does not pull fishmeet-config.js file.

