/* @flow */

import Recording from '../../../modules/UI/recording/Recording';
import SideContainerToggler
    from '../../../modules/UI/side_pannels/SideContainerToggler';
import UIUtil from '../../../modules/UI/util/UIUtil';
import UIEvents from '../../../service/UI/UIEvents';

import {
    changeLocalRaiseHand,
    clearToolboxTimeout,
    setSubjectSlideIn,
    setToolbarButton,
    setToolboxTimeout,
    setToolboxTimeoutMS,
    setToolboxVisible,
    toggleFullScreen,
    toggleToolbarButton
} from './actions.native';
import { SET_DEFAULT_TOOLBOX_BUTTONS } from './actionTypes';
import { getDefaultToolboxButtons } from './functions';

declare var $: Function;
declare var APP: Object;
declare var config: Object;
declare var interfaceConfig: Object;

export * from './actions.native';

/**
 * Checks whether desktop sharing is enabled and whether
 * we have params to start automatically sharing.
 *
 * @returns {Function}
 */
export function checkAutoEnableDesktopSharing(): Function {
    return () => {
        // XXX Should use dispatcher to toggle screensharing but screensharing
        // hasn't been React-ified yet.
        if (UIUtil.isButtonEnabled('desktop')
                && config.autoEnableDesktopSharing) {
            APP.UI.eventEmitter.emit(UIEvents.TOGGLE_SCREENSHARING);
        }
    };
}

/**
 * Docks/undocks the Toolbox.
 *
 * @param {boolean} dock - True if dock, false otherwise.
 * @returns {Function}
 */
export function dockToolbox(dock: boolean): Function {
    return (dispatch: Dispatch<*>, getState: Function) => {
        if (interfaceConfig.filmStripOnly) {
            return;
        }

        const { timeoutMS, visible } = getState()['features/toolbox'];

        if (dock) {
            // First make sure the toolbox is shown.
            visible || dispatch(showToolbox());

            dispatch(clearToolboxTimeout());
        } else if (visible) {
            dispatch(
                setToolboxTimeout(
                    () => dispatch(hideToolbox()),
                    timeoutMS));
        } else {
            dispatch(showToolbox());
        }
    };
}

/**
 * Returns button on mount/unmount handlers with dispatch function stored in
 * closure.
 *
 * @param {Function} dispatch - Redux action dispatcher.
 * @param {Function} getState - The function fetching the Redux state.
 * @returns {Object} Button on mount/unmount handlers.
 * @private
 */
function _getButtonHandlers(dispatch, getState) {
    const localRaiseHandHandler
        = (...args) => dispatch(changeLocalRaiseHand(...args));
    const toggleFullScreenHandler
        = (...args) => dispatch(toggleFullScreen(...args));

    return {
        /**
         * Mount handler for desktop button.
         *
         * @type {Object}
         */
        desktop: {
            onMount: () => dispatch(showDesktopSharingButton())
        },

        /**
         * Mount/Unmount handler for toggling fullscreen button.
         *
         * @type {Object}
         */
        fullscreen: {
            onMount: () =>
                APP.UI.addListener(
                    UIEvents.FULLSCREEN_TOGGLED,
                    toggleFullScreenHandler),
            onUnmount: () =>
                APP.UI.removeListener(
                    UIEvents.FULLSCREEN_TOGGLED,
                    toggleFullScreenHandler)
        },

        /**
         * Mount handler for profile button.
         *
         * @type {Object}
         */
        profile: {
            onMount: () =>
                getState()['features/jwt']
                    || dispatch(setProfileButtonUnclickable(true))
        },

        /**
         * Mount/Unmount handlers for raisehand button.
         *
         * @type {button}
         */
        raisehand: {
            onMount: () =>
                APP.UI.addListener(
                    UIEvents.LOCAL_RAISE_HAND_CHANGED,
                    localRaiseHandHandler),
            onUnmount: () =>
                APP.UI.removeListener(
                    UIEvents.LOCAL_RAISE_HAND_CHANGED,
                    localRaiseHandHandler)
        },

        /**
         * Mount handler for recording button.
         *
         * @type {Object}
         */
        recording: {
            onMount: () =>
                config.enableRecording && dispatch(showRecordingButton())
        }
    };
}

/**
 * Hides the toolbox.
 *
 * @param {boolean} force - True to force the hiding of the toolbox without
 * caring about the extended toolbar side panels.
 * @returns {Function}
 */
export function hideToolbox(force: boolean = false): Function {
    return (dispatch: Dispatch<*>, getState: Function) => {
        const state = getState();
        const {
            alwaysVisible,
            hovered,
            timeoutMS
        } = state['features/toolbox'];

        if (alwaysVisible) {
            return;
        }

        dispatch(clearToolboxTimeout());

        if (!force
                && (hovered
                    || state['features/jwt'].callOverlayVisible
                    || SideContainerToggler.isVisible())) {
            dispatch(
                setToolboxTimeout(
                    () => dispatch(hideToolbox()),
                    timeoutMS));
        } else {
            dispatch(setToolboxVisible(false));
            dispatch(setSubjectSlideIn(false));
        }
    };
}

/**
 * Sets the default toolbar buttons of the Toolbox.
 *
 * @returns {Function}
 */
export function setDefaultToolboxButtons(): Function {
    return (dispatch: Dispatch, getState: Function) => {
        // Save dispatch function in closure.
        const buttonHandlers = _getButtonHandlers(dispatch, getState);
        const toolboxButtons = getDefaultToolboxButtons(buttonHandlers);

        dispatch({
            type: SET_DEFAULT_TOOLBOX_BUTTONS,
            ...toolboxButtons
        });
    };
}

/**
 * Signals that unclickable property of profile button should change its value.
 *
 * @param {boolean} unclickable - Shows whether button is unclickable.
 * @returns {Function}
 */
export function setProfileButtonUnclickable(unclickable: boolean): Function {
    return (dispatch: Dispatch<*>) => {
        const buttonName = 'profile';

        dispatch(setToolbarButton(buttonName, {
            unclickable
        }));

        UIUtil.removeTooltip(document.getElementById('toolbar_button_profile'));
    };
}

/**
 * Shows desktop sharing button.
 *
 * @returns {Function}
 */
export function showDesktopSharingButton(): Function {
    return (dispatch: Dispatch<*>) => {
        const buttonName = 'desktop';
        const visible
            = APP.conference.isDesktopSharingEnabled
                && UIUtil.isButtonEnabled(buttonName);

        dispatch(setToolbarButton(buttonName, {
            hidden: !visible
        }));
    };
}

/**
 * Shows or hides the dialpad button.
 *
 * @param {boolean} show - Flag showing whether to show button or not.
 * @returns {Function}
 */
export function showDialPadButton(show: boolean): Function {
    return (dispatch: Dispatch<*>) => {
        const buttonName = 'dialpad';

        if (show && UIUtil.isButtonEnabled(buttonName)) {
            dispatch(setToolbarButton(buttonName, {
                hidden: false
            }));
        }
    };
}

/**
 * Shows recording button.
 *
 * @returns {Function}
 */
export function showRecordingButton(): Function {
    return (dispatch: Dispatch<*>) => {
        dispatch(setToolbarButton('recording', {
            hidden: false
        }));

        Recording.initRecordingButton();
    };
}

/**
 * Shows or hides the 'shared video' button.
 *
 * @returns {Function}
 */
export function showSharedVideoButton(): Function {
    return (dispatch: Dispatch<*>) => {
        const buttonName = 'sharedvideo';

        if (UIUtil.isButtonEnabled(buttonName)
                && !config.disableThirdPartyRequests) {
            dispatch(setToolbarButton(buttonName, {
                hidden: false
            }));
        }
    };
}

/**
 * Shows the dial out button if it's required and appropriate
 * flag is passed.
 *
 * @param {boolean} show - Flag showing whether to show button or not.
 * @returns {Function}
 */
export function showDialOutButton(show: boolean): Function {
    return (dispatch: Dispatch<*>, getState: Function) => {
        const buttonName = 'dialout';

        if (show
                && APP.conference.sipGatewayEnabled()
                && UIUtil.isButtonEnabled(buttonName)
                && (!config.enableUserRolesBasedOnToken
                    || !getState()['features/jwt'].isGuest)) {
            dispatch(setToolbarButton(buttonName, {
                hidden: false
            }));
        }
    };
}

/**
 * Shows the toolbox for specified timeout.
 *
 * @param {number} timeout - Timeout for showing the toolbox.
 * @returns {Function}
 */
export function showToolbox(timeout: number = 0): Object {
    return (dispatch: Dispatch<*>, getState: Function) => {
        const state = getState();
        const {
            alwaysVisible,
            enabled,
            timeoutMS,
            visible
        } = state['features/toolbox'];

        if (enabled && !visible) {
            dispatch(setToolboxVisible(true));
            dispatch(setSubjectSlideIn(true));

            // If the Toolbox is always visible, there's no need for a timeout
            // to toggle its visibility.
            if (!alwaysVisible) {
                dispatch(
                    setToolboxTimeout(
                        () => dispatch(hideToolbox()),
                        timeout || timeoutMS));
                dispatch(setToolboxTimeoutMS(interfaceConfig.TOOLBAR_TIMEOUT));
            }
        }
    };
}

/**
 * Event handler for side toolbar container toggled event.
 *
 * @param {string} containerId - ID of the container.
 * @returns {Function}
 */
export function toggleSideToolbarContainer(containerId: string): Function {
    return (dispatch: Dispatch, getState: Function) => {
        const { secondaryToolbarButtons } = getState()['features/toolbox'];

        for (const key of secondaryToolbarButtons.keys()) {
            const isButtonEnabled = UIUtil.isButtonEnabled(key);
            const button = secondaryToolbarButtons.get(key);

            if (isButtonEnabled
                    && button.sideContainerId
                    && button.sideContainerId === containerId) {
                dispatch(toggleToolbarButton(key));
                break;
            }
        }
    };
}
