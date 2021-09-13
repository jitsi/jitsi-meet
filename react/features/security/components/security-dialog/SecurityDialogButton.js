// @flow

import type { Dispatch } from 'redux';

import { createToolbarEvent, sendAnalytics } from '../../../analytics';
import {
    getFeatureFlag,
    LOBBY_MODE_ENABLED,
    MEETING_PASSWORD_ENABLED,
    SECURITY_OPTIONS_ENABLED
} from '../../../base/flags';
import { translate } from '../../../base/i18n';
import { IconSecurityOff, IconSecurityOn } from '../../../base/icons';
import { isLocalParticipantModerator } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';
import { toggleSecurityDialog } from '../../actions';


type Props = AbstractButtonProps & {

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
 * Implements an {@link AbstractButton} to open the security dialog.
 */
class SecurityDialogButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.security';
    icon = IconSecurityOff;
    label = 'toolbar.security';
    toggledIcon = IconSecurityOn;
    tooltip = 'toolbar.security';

    /**
     * Handles clicking / pressing the button, and opens / closes the appropriate dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        sendAnalytics(createToolbarEvent('toggle.security', { enable: !this.props._locked }));
        this.props.dispatch(toggleSecurityDialog());
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
function mapStateToProps(state: Object) {
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
        visible: enabledFlag || (enabledLobbyModeFlag || enabledMeetingPassFlag)
    };
}

export default translate(connect(mapStateToProps)(SecurityDialogButton));
