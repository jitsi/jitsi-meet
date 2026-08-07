import { NativeModules } from 'react-native';

/**
 * The device's physical screen corner radius (points), used to make the
 * expired-timer frame hug the screen edges on every device.
 *
 * Reads the native {@code ScreenCornerRadius} module from
 * react-native-screen-corner-radius. The module is absent on platforms/devices
 * it doesn't support (e.g. Android), where accessing it directly would throw —
 * so we read it defensively and fall back to a small inset that reads cleanly
 * and never overshoots the curve.
 */
const FALLBACK_RADIUS = 24;

const nativeRadius = NativeModules.ScreenCornerRadius?.cornerRadius;

export const SCREEN_CORNER_RADIUS
    = typeof nativeRadius === 'number' && nativeRadius > 0 ? nativeRadius : FALLBACK_RADIUS;
