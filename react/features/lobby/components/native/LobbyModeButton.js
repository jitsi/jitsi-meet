// @flow

import { getCurrentConference } from '../../../base/conference';
import { translate } from '../../../base/i18n';
import { IconMeetingUnlocked, IconMeetingLocked } from '../../../base/icons';
import { isLocalParticipantModerator } from '../../../base/participants';
import { connect } from '../../../base/redux';
import AbstractButton, { type Props as AbstractProps } from '../../../base/toolbox/components/AbstractButton';
import { showDisableLobbyModeDialog, showEnableLobbyModeDialog } from '../../actions.native';

type Props = AbstractProps & {

    /**
     * The Redux Dispatch function.
     */
    dispatch: Function,

    /**
     * True if the lobby mode is currently enabled for this conference.
     */
    lobbyEnabled: boolean
};

/**
 * Component to render the lobby mode initiator button.
 */
class LobbyModeButton extends AbstractButton<Props, any> {
    accessibilityLabel = 'toolbar.accessibilityLabel.lobbyButton';
    icon = IconMeetingUnlocked;
    label = 'toolbar.lobbyButtonEnable';
    toggledLabel = 'toolbar.lobbyButtonDisable'
    toggledIcon = IconMeetingLocked;

    /**
     * Callback for the click event of the button.
     *
     * @returns {void}
     */
    _handleClick() {
        const { dispatch } = this.props;

        if (this._isToggled()) {
            dispatch(showDisableLobbyModeDialog());
        } else {
            dispatch(showEnableLobbyModeDialog());
        }
    }

    /**
     * Function to define the button state.
     *
     * @returns {boolean}
     */
    _isToggled() {
        return this.props.lobbyEnabled;
    }
}

/**
 * Maps part of the Redux store to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The own props of the component.
 * @returns {Props}
 */
export function _mapStateToProps(state: Object): $Shape<Props> {
    const conference = getCurrentConference(state);
    const { lobbyEnabled } = state['features/lobby'];
    const { hideLobbyButton } = state['features/base/config'];
    const lobbySupported = conference && conference.isLobbySupported();

    return {
        lobbyEnabled,
        visible: lobbySupported && isLocalParticipantModerator(state) && !hideLobbyButton
    };
}

export default translate(connect(_mapStateToProps)(LobbyModeButton));
