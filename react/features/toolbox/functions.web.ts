import { IReduxState } from '../app/types';
import { hasAvailableDevices } from '../base/devices/functions.web';
import { MEET_FEATURES } from '../base/jwt/constants';
import { isJwtFeatureEnabled } from '../base/jwt/functions';
import { IGUMPendingState } from '../base/media/types';
import { isScreenMediaShared } from '../screen-share/functions';
import { isWhiteboardVisible } from '../whiteboard/functions';

import { MAIN_TOOLBAR_BUTTONS_PRIORITY, TOOLBAR_TIMEOUT } from './constants';
import { isButtonEnabled } from './functions.any';
import { IGetVisibleButtonsParams, IToolboxButton, NOTIFY_CLICK_MODE } from './types';

export * from './functions.any';

/**
 * Helper for getting the height of the toolbox.
 *
 * @returns {number} The height of the toolbox.
 */
export function getToolboxHeight() {
    const toolbox = document.getElementById('new-toolbox');

    return toolbox?.clientHeight || 0;
}

/**
 * Indicates if the toolbox is visible or not.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean} - True to indicate that the toolbox is visible, false -
 * otherwise.
 */
export function isToolboxVisible(state: IReduxState) {
    const { iAmRecorder, iAmSipGateway, toolbarConfig } = state['features/base/config'];
    const { alwaysVisible } = toolbarConfig || {};
    const {
        timeoutID,
        visible
    } = state['features/toolbox'];
    const { audioSettingsVisible, videoSettingsVisible } = state['features/settings'];
    const whiteboardVisible = isWhiteboardVisible(state);

    return Boolean(!iAmRecorder && !iAmSipGateway
            && (
                timeoutID
                || visible
                || alwaysVisible
                || audioSettingsVisible
                || videoSettingsVisible
                || whiteboardVisible
            ));
}

/**
 * Indicates if the audio settings button is disabled or not.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export function isAudioSettingsButtonDisabled(state: IReduxState) {

    return !(hasAvailableDevices(state, 'audioInput')
        || hasAvailableDevices(state, 'audioOutput'))
        || state['features/base/config'].startSilent;
}

/**
 * Indicates if the desktop share button is disabled or not.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export function isDesktopShareButtonDisabled(state: IReduxState) {
    const { muted, unmuteBlocked } = state['features/base/media'].video;
    const videoOrShareInProgress = !muted || isScreenMediaShared(state);
    const enabledInJwt = isJwtFeatureEnabled(state, MEET_FEATURES.SCREEN_SHARING, true);

    return !enabledInJwt || (unmuteBlocked && !videoOrShareInProgress);
}

/**
 * Indicates if the video settings button is disabled or not.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export function isVideoSettingsButtonDisabled(state: IReduxState) {
    return !hasAvailableDevices(state, 'videoInput');
}

/**
 * Indicates if the video mute button is disabled or not.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export function isVideoMuteButtonDisabled(state: IReduxState) {
    const { muted, unmuteBlocked, gumPending } = state['features/base/media'].video;

    return !hasAvailableDevices(state, 'videoInput')
        || (unmuteBlocked && Boolean(muted))
        || gumPending !== IGUMPendingState.NONE;
}

/**
 * If an overflow drawer should be displayed or not.
 * This is usually done for mobile devices or on narrow screens.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export function showOverflowDrawer(state: IReduxState) {
    return state['features/toolbox'].overflowDrawer;
}

/**
 * Returns the toolbar timeout from config or the default value.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {number} - Toolbar timeout in milliseconds.
 */
export function getToolbarTimeout(state: IReduxState) {
    const { toolbarConfig } = state['features/base/config'];

    return toolbarConfig?.timeout || TOOLBAR_TIMEOUT;
}

/**
 * Sets the notify click mode for the buttons.
 *
 * @param {Object} buttons - The list of toolbar buttons.
 * @param {Map} buttonsWithNotifyClick - The buttons notify click configuration.
 * @returns {void}
 */
function setButtonsNotifyClickMode(buttons: Object, buttonsWithNotifyClick: Map<string, NOTIFY_CLICK_MODE>) {
    if (typeof APP === 'undefined' || (buttonsWithNotifyClick?.size ?? 0) <= 0) {
        return;
    }

    Object.values(buttons).forEach((button: any) => {
        if (typeof button === 'object') {
            button.notifyMode = buttonsWithNotifyClick.get(button.key);
        }
    });
}

/**
 * Returns all buttons that need to be rendered.
 *
 * @param {IGetVisibleButtonsParams} params - The parameters needed to extract the visible buttons.
 * @returns {Object} - The visible buttons arrays .
 */
export function getVisibleButtons({
    allButtons,
    buttonsWithNotifyClick,
    toolbarButtons,
    clientWidth,
    jwtDisabledButtons,
    mainToolbarButtonsThresholds
}: IGetVisibleButtonsParams) {
    setButtonsNotifyClickMode(allButtons, buttonsWithNotifyClick);

    const filteredButtons = Object.keys(allButtons).filter(key =>
        typeof key !== 'undefined' // filter invalid buttons that may be coming from config.mainToolbarButtons
        // override
        && !jwtDisabledButtons.includes(key)
        && isButtonEnabled(key, toolbarButtons));


    const { order } = mainToolbarButtonsThresholds.find(({ width }) => clientWidth > width)
        || mainToolbarButtonsThresholds[mainToolbarButtonsThresholds.length - 1];

    const mainToolbarButtonKeysOrder = [
        ...order.filter(key => filteredButtons.includes(key)),
        ...MAIN_TOOLBAR_BUTTONS_PRIORITY.filter(key => !order.includes(key) && filteredButtons.includes(key)),
        ...filteredButtons.filter(key => !order.includes(key) && !MAIN_TOOLBAR_BUTTONS_PRIORITY.includes(key))
    ];

    const mainButtonsKeys = mainToolbarButtonKeysOrder.slice(0, order.length);
    const overflowMenuButtons = filteredButtons.reduce((acc, key) => {
        if (!mainButtonsKeys.includes(key)) {
            acc.push(allButtons[key]);
        }

        return acc;
    }, [] as IToolboxButton[]);

    // if we have 1 button in the overflow menu it is better to directly display it in the main toolbar by replacing
    // the "More" menu button with it.
    if (overflowMenuButtons.length === 1) {
        const button = overflowMenuButtons.shift()?.key;

        button && mainButtonsKeys.push(button);
    }

    const mainMenuButtons = mainButtonsKeys.map(key => allButtons[key]);

    return {
        mainMenuButtons,
        overflowMenuButtons
    };
}

/**
 * Returns the list of participant menu buttons that have that notify the api when clicked.
 *
 * @param {Object} state - The redux state.
 * @returns {Map<string, NOTIFY_CLICK_MODE>} - The list of participant menu buttons.
 */
export function getParticipantMenuButtonsWithNotifyClick(state: IReduxState): Map<string, NOTIFY_CLICK_MODE> {
    return state['features/toolbox'].participantMenuButtonsWithNotifyClick;
}

interface ICSSTransitionObject {
    delay: number;
    duration: number;
    easingFunction: string;
}

/**
 * Returns the time, timing function and delay for elements that are position above the toolbar and need to move along
 * with the toolbar.
 *
 * @param {boolean} isToolbarVisible - Whether the toolbar is visible or not.
 * @returns {ICSSTransitionObject}
 */
export function getTransitionParamsForElementsAboveToolbox(isToolbarVisible: boolean): ICSSTransitionObject {
    // The transition time and delay is different to account for the time when the toolbar is about to hide/show but
    // the elements don't have to move.
    return isToolbarVisible ? {
        duration: 0.15,
        easingFunction: 'ease-in',
        delay: 0.15
    } : {
        duration: 0.24,
        easingFunction: 'ease-in',
        delay: 0
    };
}

/**
 * Converts a given object to a css transition value string.
 *
 * @param {ICSSTransitionObject} object - The object.
 * @returns {string}
 */
export function toCSSTransitionValue(object: ICSSTransitionObject) {
    const { delay, duration, easingFunction } = object;

    return `${duration}s ${easingFunction} ${delay}s`;
}
