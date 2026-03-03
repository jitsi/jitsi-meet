import { IReduxState } from '../app/types';
import { IStateful } from '../base/app/types';
import { hasAvailableDevices } from '../base/devices/functions.native';
import { TOOLBOX_ALWAYS_VISIBLE, TOOLBOX_ENABLED } from '../base/flags/constants';
import { getFeatureFlag } from '../base/flags/functions';
import { getParticipantCountWithFake } from '../base/participants/functions';
import { toState } from '../base/redux/functions';
import { isLocalVideoTrackDesktop } from '../base/tracks/functions.native';

import { MAIN_TOOLBAR_BUTTONS_PRIORITY, VISITORS_MODE_BUTTONS } from './constants';
import { isButtonEnabled } from './functions.any';
import { IGetVisibleNativeButtonsParams, IToolboxNativeButton } from './types';

export * from './functions.any';

/**
 * Indicates if the desktop share button is disabled or not.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export function isDesktopShareButtonDisabled(state: IReduxState) {
    const { muted, unmuteBlocked } = state['features/base/media'].video;
    const videoOrShareInProgress = !muted || isLocalVideoTrackDesktop(state);

    return unmuteBlocked && !videoOrShareInProgress;
}

/**
 * Returns true if the toolbox is visible.
 *
 * @param {IStateful} stateful - A function or object that can be
 * resolved to Redux state by the function {@code toState}.
 * @returns {boolean}
 */
export function isToolboxVisible(stateful: IStateful) {
    const state = toState(stateful);
    const { toolbarConfig } = state['features/base/config'];
    const { alwaysVisible } = toolbarConfig || {};
    const { enabled, visible } = state['features/toolbox'];
    const participantCount = getParticipantCountWithFake(state);
    const alwaysVisibleFlag = getFeatureFlag(state, TOOLBOX_ALWAYS_VISIBLE, false);
    const enabledFlag = getFeatureFlag(state, TOOLBOX_ENABLED, true);

    return enabledFlag && enabled
        && (alwaysVisible || visible || participantCount === 1 || alwaysVisibleFlag);
}

/**
 * Indicates if the video mute button is disabled or not.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export function isVideoMuteButtonDisabled(state: IReduxState) {
    const { muted, unmuteBlocked } = state['features/base/media'].video;

    return !hasAvailableDevices(state, 'videoInput')
        || (unmuteBlocked && Boolean(muted));
}


/**
 * Returns all buttons that need to be rendered.
 *
 * @param {IGetVisibleButtonsParams} params - The parameters needed to extract the visible buttons.
 * @returns {Object} - The visible buttons arrays .
 */
export function getVisibleNativeButtons(
        { allButtons, clientWidth, iAmVisitor, mainToolbarButtonsThresholds, toolbarButtons }: IGetVisibleNativeButtonsParams) {
    let filteredButtons = Object.keys(allButtons).filter(key =>
        typeof key !== 'undefined' // filter invalid buttons that may be coming from config.mainToolbarButtons override
        && isButtonEnabled(key, toolbarButtons));

    if (iAmVisitor) {
        filteredButtons = VISITORS_MODE_BUTTONS.filter((button: string) => filteredButtons.indexOf(button) > -1);
    }

    const { order } = mainToolbarButtonsThresholds.find(({ width }: { width: number; }) => clientWidth > width)
    || mainToolbarButtonsThresholds[mainToolbarButtonsThresholds.length - 1];

    const mainToolbarButtonKeysOrder = [
        ...order.filter((key: string) => filteredButtons.includes(key)),
        ...MAIN_TOOLBAR_BUTTONS_PRIORITY.filter((key: string) => !order.includes(key) && filteredButtons.includes(key)),
        ...filteredButtons.filter((key: string) => !order.includes(key) && !MAIN_TOOLBAR_BUTTONS_PRIORITY.includes(key))
    ];

    const mainButtonsKeys = mainToolbarButtonKeysOrder.slice(0, order.length);
    const overflowMenuButtons = filteredButtons.reduce((acc, key) => {
        if (!mainButtonsKeys.includes(key)) {
            acc.push(allButtons[key]);
        }

        return acc;
    }, [] as IToolboxNativeButton[]);

    // if we have 1 button in the overflow menu it is better to directly display it in the main toolbar by replacing
    // the "More" menu button with it.
    if (overflowMenuButtons.length === 1) {
        const button = overflowMenuButtons.shift()?.key;

        button && mainButtonsKeys.push(button);
    }

    const mainMenuButtons
        = mainButtonsKeys.map(key => allButtons[key]).sort((a, b) => {

            // Native toolbox includes hangup and overflowmenu button keys, too
            // hangup goes last, overflowmenu goes second-to-last
            if (a.key === 'hangup' || a.key === 'overflowmenu') {
                return 1;
            }

            if (b.key === 'hangup' || b.key === 'overflowmenu') {
                return -1;
            }

            return 0; // other buttons are sorted by priority
        });

    return {
        mainMenuButtons,
        overflowMenuButtons
    };
}

// Screen width thresholds for different icon counts (fishmeet)
const WIDTH = {
    FIT_9_ICONS: 520,
    FIT_8_ICONS: 470,
    FIT_7_ICONS: 420,
    FIT_6_ICONS: 370,
    FIT_5_ICONS: 320
};

/**
 * Returns the buttons that should be displayed based on screen width for FishMeet layout.
 *
 * @param {number} width - The width of the screen.
 * @returns {Set<string>} - A set of button keys that should be displayed.
 */
export function getMovableButtons(width: number): Set<string> {
    let buttons: string[] = [];

    switch (true) {
    case width >= WIDTH.FIT_9_ICONS: {
        buttons = [ 'chat', 'togglecamera', 'screensharing', 'raisehand', 'audionly', 'tileview' ];
        break;
    }
    case width >= WIDTH.FIT_8_ICONS: {
        buttons = [ 'chat', 'togglecamera', 'raisehand', 'audionly', 'tileview' ];
        break;
    }
    case width >= WIDTH.FIT_7_ICONS: {
        buttons = [ 'chat', 'togglecamera', 'raisehand', 'audionly', 'tileview' ];
        break;
    }
    case width >= WIDTH.FIT_6_ICONS: {
        buttons = [ 'chat', 'togglecamera', 'raisehand', 'audionly' ];
        break;
    }
    default: {
        buttons = [ 'chat', 'togglecamera', 'raisehand', 'audionly' ];
    }
    }

    return new Set(buttons);
}
