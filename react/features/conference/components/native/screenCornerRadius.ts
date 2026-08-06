import { ScreenCornerRadius } from 'react-native-screen-corner-radius';

/**
 * The device's physical screen corner radius (points), used to make the
 * expired-timer frame hug the screen edges on every device.
 *
 * {@code react-native-screen-corner-radius} reads the real hardware radius; it
 * returns 0 when it can't detect one (e.g. some Android devices), so we fall
 * back to a small inset that reads cleanly and never overshoots the curve.
 */
const FALLBACK_RADIUS = 24;

export const SCREEN_CORNER_RADIUS = ScreenCornerRadius > 0 ? ScreenCornerRadius : FALLBACK_RADIUS;
