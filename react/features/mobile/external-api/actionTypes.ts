/**
 * The type of the action which indicates the SDK is ready to be closed.
 *
 * @returns {{
 *     type: READY_TO_CLOSE
 * }}
 */
export const READY_TO_CLOSE = 'READY_TO_CLOSE';

/**
 * The type of the action which sets the list of known participant IDs which
 * have an active screen share.
 *
 * @returns {{
    *     type: SCREEN_SHARE_PARTICIPANTS_UPDATED,
    *     participantIds: Array<string>
    * }}
    */
export const SCREEN_SHARE_PARTICIPANTS_UPDATED
    = 'SCREEN_SHARE_PARTICIPANTS_UPDATED';

/**
 * The type of (redux) action which signals that a custom button from the overflow menu was pressed.
 *
 * @returns {{
 *      type: CUSTOM_OVERFLOW_MENU_BUTTON_PRESSED,
 *      id: string,
 *      text: string
 * }}
 */
export const CUSTOM_OVERFLOW_MENU_BUTTON_PRESSED = 'CUSTOM_OVERFLOW_MENU_BUTTON_PRESSED';
