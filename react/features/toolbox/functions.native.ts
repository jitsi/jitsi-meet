import { IReduxState } from '../app/types';
import { IStateful } from '../base/app/types';
import { hasAvailableDevices } from '../base/devices/functions.native';
import { TOOLBOX_ALWAYS_VISIBLE, TOOLBOX_ENABLED } from '../base/flags/constants';
import { getFeatureFlag } from '../base/flags/functions';
import { getParticipantCountWithFake } from '../base/participants/functions';
import { toState } from '../base/redux/functions';
import { isLocalVideoTrackDesktop } from '../base/tracks/functions.native';
import { MAIN_TOOLBAR_BUTTONS_PRIORITY } from './constants';
import { IGetVisibleNativeButtonsParams, IToolboxButton } from './types';
import { isButtonEnabled } from './functions.any';

export * from './functions.any';

const WIDTH = {
    FIT_9_ICONS: 560,
    FIT_8_ICONS: 500,
    FIT_7_ICONS: 440,
    FIT_6_ICONS: 380
};

/**
 * Returns a set of the buttons that are shown in the toolbar
 * but removed from the overflow menu, based on the width of the screen.
 *
 * @param {number} width - The width of the screen.
 * @returns {Set}
 */
export function getMovableButtons(width: number): Set<string> {
    let buttons: string[] = [];

    switch (true) {
    case width >= WIDTH.FIT_9_ICONS: {
        buttons = [ 'microphone', 'camera', 'chat', 'screensharing', 'raisehand', 'tileview' ];
        break;
    }
    case width >= WIDTH.FIT_8_ICONS: {
        buttons = [ 'microphone', 'camera', 'chat', 'raisehand', 'tileview' ];
        break;
    }

    case width >= WIDTH.FIT_7_ICONS: {
        buttons = [ 'microphone', 'camera', 'chat', 'raisehand' ];
        break;
    }

    case width >= WIDTH.FIT_6_ICONS: {
        buttons = [ 'microphone', 'camera', 'chat', 'togglecamera' ];
        break;
    }

    default: {
        buttons = [ 'chat' ];
    }
    }

    return new Set(buttons);
}

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
export function getVisibleNativeButtons({
                                      allButtons,
                                      clientWidth,
                                      mainToolbarButtonsThresholds,
                                      toolbarButtons
                                  }: IGetVisibleNativeButtonsParams) {
    const filteredButtons = Object.keys(allButtons).filter(key =>
        typeof key !== 'undefined' // filter invalid buttons that may be coming from config.mainToolbarButtons
        // override
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
