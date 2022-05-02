// @flow

import type { Dispatch } from 'redux';

import { createToolbarEvent, sendAnalytics } from '../../../analytics';
import {
    getFeatureFlag,
    LOBBY_MODE_ENABLED,
    MEETING_PASSWORD_ENABLED,
    SECURITY_OPTIONS_ENABLED
} from '../../../base/flags';
import { IconSecurityOff, IconSecurityOn } from '../../../base/icons';
import { isLocalParticipantModerator } from '../../../base/participants';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';

export type Props = AbstractButtonProps & {

    /**
     * Whether the shared document is being edited or not.
     */
    _locked: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Dispatch<any>
};


/**
 * Implements an {@link AbstractButton} to open the security dialog/screen.
 */
export default class AbstractSecurityDialogButton<P: Props, S:*>
    extends AbstractButton<P, S> {
    accessibilityLabel = 'toolbar.accessibilityLabel.security';
    icon = IconSecurityOff;
    label = 'toolbar.security';
    toggledIcon = IconSecurityOn;
    tooltip = 'toolbar.security';

    /**
     * Helper function to be implemented by subclasses, which should be used
     * to handle the security button being clicked / pressed.
     *
     * @protected
     * @returns {void}
     */
    _handleClickSecurityButton() {
        // To be implemented by subclass.
    }

    /**
     * Handles clicking / pressing the button.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { _locked } = this.props;

        sendAnalytics(createToolbarEvent('toggle.security', { enable: !_locked }));
        this._handleClickSecurityButton();
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._locked;
    }
}

/**
 * Maps part of the redux state to the component's props.
 *
 * @param {Object} state - The redux store/state.
 * @returns {Props}
 */
export function _mapStateToProps(state: Object) {
    const { conference } = state['features/base/conference'];
    const { hideLobbyButton } = state['features/base/config'];
    const { locked } = state['features/base/conference'];
    const { lobbyEnabled } = state['features/lobby'];
    const lobbySupported = conference && conference.isLobbySupported();
    const lobby = lobbySupported && isLocalParticipantModerator(state) && !hideLobbyButton;
    const enabledFlag = getFeatureFlag(state, SECURITY_OPTIONS_ENABLED, true);
    const enabledLobbyModeFlag = getFeatureFlag(state, LOBBY_MODE_ENABLED, true) && lobby;
    const enabledMeetingPassFlag = getFeatureFlag(state, MEETING_PASSWORD_ENABLED, true);

    return {
        _locked: locked || lobbyEnabled,
        visible: enabledFlag && (enabledLobbyModeFlag || enabledMeetingPassFlag)
    };
}
