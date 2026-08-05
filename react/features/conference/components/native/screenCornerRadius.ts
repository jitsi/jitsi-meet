import DeviceInfo from 'react-native-device-info';

/**
 * The physical screen corner radius (in points) for the device, used to make
 * the expired-timer frame hug the screen edges cleanly on every device.
 *
 * There is no PUBLIC API for the hardware corner radius on iOS, so — mirroring
 * how `expo-screen-corner-radius` does it, but with zero new dependencies
 * (Jitsi already ships `react-native-device-info`) — we map the hardware model
 * id ({@code getDeviceId()}, e.g. "iPhone16,1") to its known radius, and fall
 * back to a sensible value derived from the device's notch / Dynamic Island for
 * unknown or future models and for Android.
 */

// Known iPhone screen corner radii (points), keyed by hardware model id.
// Values are the display corner radii Apple ships per model. Grouped so future
// models in the same family fall through to the notch/island heuristic below.
const IPHONE_RADII: { [model: string]: number; } = {
    // iPhone X / XS / 11 Pro family — 39pt.
    'iPhone10,3': 39, 'iPhone10,6': 39, // X
    'iPhone11,2': 39, 'iPhone11,4': 39, 'iPhone11,6': 39, // XS / XS Max
    'iPhone12,3': 39, 'iPhone12,5': 39, // 11 Pro / Pro Max

    // iPhone XR / 11 — 41.5pt.
    'iPhone11,8': 41.5, // XR
    'iPhone12,1': 41.5, // 11

    // iPhone 12 / 13 / 14 (non-Pro & Pro) — 47.33pt.
    'iPhone13,1': 44, // 12 mini
    'iPhone13,2': 47.33, 'iPhone13,3': 47.33, 'iPhone13,4': 47.33, // 12 / 12 Pro / Pro Max
    'iPhone14,4': 44, // 13 mini
    'iPhone14,5': 47.33, 'iPhone14,2': 47.33, 'iPhone14,3': 47.33, // 13 / 13 Pro / Pro Max
    'iPhone14,7': 47.33, 'iPhone14,8': 47.33, // 14 / 14 Plus

    // iPhone 14 Pro / 15 / 16 family — 55pt (Dynamic Island models).
    'iPhone15,2': 55, 'iPhone15,3': 55, // 14 Pro / Pro Max
    'iPhone15,4': 55, 'iPhone15,5': 55, // 15 / 15 Plus
    'iPhone16,1': 55, 'iPhone16,2': 55, // 15 Pro / Pro Max
    'iPhone17,3': 55, 'iPhone17,4': 55, // 16 / 16 Plus
    'iPhone17,1': 55, 'iPhone17,2': 55 // 16 Pro / Pro Max
};

// Heuristic fallbacks (points) for unknown/future iOS models and Android,
// picked so the frame never overshoots the real curve — a slightly smaller
// radius reads as a clean inset corner rather than a cut one.
const FALLBACK_DYNAMIC_ISLAND = 55;
const FALLBACK_NOTCH = 47.33;
const FALLBACK_ROUNDED = 24;

/**
 * Resolves the device's screen corner radius in points. Computed once at module
 * load (the hardware model never changes at runtime).
 *
 * @returns {number}
 */
function resolveScreenCornerRadius(): number {
    const model = DeviceInfo.getDeviceId();

    if (Object.prototype.hasOwnProperty.call(IPHONE_RADII, model)) {
        return IPHONE_RADII[model];
    }

    // Unknown iOS model (newer than this table) or Android: infer from the
    // display shape. hasDynamicIsland()/hasNotch() are the strongest signals
    // available without a native corner-radius API.
    if (DeviceInfo.hasDynamicIsland()) {
        return FALLBACK_DYNAMIC_ISLAND;
    }
    if (DeviceInfo.hasNotch()) {
        return FALLBACK_NOTCH;
    }

    // Older / square-ish devices — a small radius still reads well and never
    // overshoots a squarer screen.
    return FALLBACK_ROUNDED;
}

/**
 * The device screen corner radius in points. The hardware model is fixed for
 * the lifetime of the process, so this is resolved once.
 */
export const SCREEN_CORNER_RADIUS = resolveScreenCornerRadius();
