/* @flow */

import Recording from '../../../modules/UI/recording/Recording';
import SideContainerToggler
    from '../../../modules/UI/side_pannels/SideContainerToggler';
import UIEvents from '../../../service/UI/UIEvents';
import UIUtil from '../../../modules/UI/util/UIUtil';

import {
    clearToolbarTimeout,
    setAlwaysVisibleToolbar,
    setSubjectSlideIn,
    setToolbarButton,
    setToolbarTimeout,
    setToolbarTimeoutNumber,
    setToolbarVisible,
    toggleToolbarButton
} from './actions.native';

export * from './actions.native';

declare var $: Function;
declare var APP: Object;
declare var config: Object;
declare var interfaceConfig: Object;

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
 * Docks/undocks toolbar based on its parameter.
 *
 * @param {boolean} dock - True if dock, false otherwise.
 * @returns {Function}
 */
export function dockToolbar(dock: boolean): Function {
    return (dispatch: Dispatch<*>, getState: Function) => {
        if (interfaceConfig.filmStripOnly) {
            return;
        }

        const state = getState();
        const { toolbarTimeout, visible } = state['features/toolbar'];

        if (dock) {
            // First make sure the toolbar is shown.
            visible || dispatch(showToolbar());

            dispatch(clearToolbarTimeout());
        } else if (visible) {
            dispatch(
                setToolbarTimeout(
                    () => dispatch(hideToolbar()),
                    toolbarTimeout));
        } else {
            dispatch(showToolbar());
        }
    };
}

/**
 * Hides the toolbar.
 *
 * @param {boolean} force - True to force the hiding of the toolbar without
 * caring about the extended toolbar side panels.
 * @returns {Function}
 */
export function hideToolbar(force: boolean = false): Function {
    return (dispatch: Dispatch<*>, getState: Function) => {
        const state = getState();
        const {
            alwaysVisible,
            hovered,
            toolbarTimeout
        } = state['features/toolbar'];

        if (alwaysVisible) {
            return;
        }

        dispatch(clearToolbarTimeout());

        if (!force
                && (hovered
                    || APP.UI.isRingOverlayVisible()
                    || SideContainerToggler.isVisible())) {
            dispatch(
                setToolbarTimeout(
                    () => dispatch(hideToolbar()),
                    toolbarTimeout));
        } else {
            dispatch(setToolbarVisible(false));
            dispatch(setSubjectSlideIn(false));
        }
    };
}

/**
 * Action that reset always visible toolbar to default state.
 *
 * @returns {Function}
 */
export function resetAlwaysVisibleToolbar(): Function {
    return (dispatch: Dispatch<*>) => {
        const alwaysVisible = config.alwaysVisibleToolbar === true;

        dispatch(setAlwaysVisibleToolbar(alwaysVisible));
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
        const shouldShow = UIUtil.isButtonEnabled(buttonName) && show;

        if (shouldShow) {
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
        const eventEmitter = APP.UI.eventEmitter;
        const buttonName = 'recording';

        dispatch(setToolbarButton(buttonName, {
            hidden: false
        }));

        Recording.init(eventEmitter, config.recordingType);
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
        const shouldShow
            = UIUtil.isButtonEnabled(buttonName)
                && !config.disableThirdPartyRequests;

        if (shouldShow) {
            dispatch(setToolbarButton(buttonName, {
                hidden: false
            }));
        }
    };
}

/**
 * Shows SIP call button if it's required and appropriate
 * flag is passed.
 *
 * @param {boolean} show - Flag showing whether to show button or not.
 * @returns {Function}
 */
export function showSIPCallButton(show: boolean): Function {
    return (dispatch: Dispatch<*>) => {
        const buttonName = 'sip';
        const shouldShow
            = APP.conference.sipGatewayEnabled()
                && UIUtil.isButtonEnabled(buttonName)
                && show;

        if (shouldShow) {
            dispatch(setToolbarButton(buttonName, {
                hidden: !shouldShow
            }));
        }
    };
}

/**
 * Shows the toolbar for specified timeout.
 *
 * @param {number} timeout - Timeout for showing the toolbar.
 * @returns {Function}
 */
export function showToolbar(timeout: number = 0): Object {
    return (dispatch: Dispatch<*>, getState: Function) => {
        if (interfaceConfig.filmStripOnly) {
            return;
        }

        const state = getState();
        const { toolbarTimeout, visible } = state['features/toolbar'];
        const finalTimeout = timeout || toolbarTimeout;

        if (!visible) {
            dispatch(setToolbarVisible(true));
            dispatch(setSubjectSlideIn(true));
            dispatch(
                setToolbarTimeout(() => dispatch(hideToolbar()), finalTimeout));
            dispatch(setToolbarTimeoutNumber(interfaceConfig.TOOLBAR_TIMEOUT));
        }
    };
}

/**
 * Event handler for side toolbar container toggled event.
 *
 * @param {string} containerId - ID of the container.
 * @returns {void}
 */
export function toggleSideToolbarContainer(containerId: string): Function {
    return (dispatch: Dispatch, getState: Function) => {
        const state = getState();
        const { secondaryToolbarButtons } = state['features/toolbar'];

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
