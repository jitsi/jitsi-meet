/**
 * Redux action type dispatched in order to toggle screenshot captures.
 *
 * {
 *      type: SET_SCREENSHOT_CAPTURE
 * }
 */

export const SET_SCREENSHOT_CAPTURE = 'SET_SCREENSHOT_CAPTURE';

/**
 * The camera capture payload.
 */
export interface ICameraCapturePayload {
  /**
   * Selected camera on open.
   */
  cameraFacingMode?: string;

  /**
   * Custom explanatory text to show.
   */
  descriptionText?: string,

  /**
   * Custom dialog title text.
   */
  titleText?: string
};
