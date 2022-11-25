import React, { PureComponent } from 'react';
import { View } from 'react-native';

import { translate } from '../../../base/i18n/functions';
import { isLocalParticipantModerator } from '../../../base/participants/functions';
import { connect } from '../../../base/redux';
import Button from '../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import { handleLobbyChatInitialized } from '../../../chat/actions.native';
import { navigate } from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';
import ParticipantItem
    from '../../../participants-pane/components/native/ParticipantItem';
import { setKnockingParticipantApproval } from '../../actions.native';
import { getKnockingParticipants, getLobbyEnabled, showLobbyChatButton } from '../../functions';

import styles from './styles';


/**
 * Props type of the component.
 */
export type Props = {

    /**
     * The list of participants.
     */
    _participants: Array<Object>,

    /**
     * True if the list should be rendered.
     */
    _visible: boolean,

    /**
     * True if the polls feature is disabled.
     */
    _isPollsDisabled: boolean,

    /**
     * Returns true if the lobby chat button should be shown.
     */
    _showChatButton: Function,

    /**
     * The Redux Dispatch function.
     */
    dispatch: Function
};

/**
 * Component to render a list for the actively knocking participants.
 */
class KnockingParticipantList extends PureComponent<Props> {
    /**
     * Instantiates a new component.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this._onRespondToParticipant = this._onRespondToParticipant.bind(this);
    }

    /**
     * Implements {@code PureComponent#render}.
     *
     * @inheritdoc
     */
    render() {
        const { _participants, _visible, _showChatButton } = this.props;

        if (!_visible) {
            return null;
        }

        return (
            <>
                { _participants.map(p => (
                    <View
                        key = { p.id }
                        style = { styles.knockingParticipantListEntry }>
                        <ParticipantItem
                            displayName = { p.name }
                            isKnockingParticipant = { true }
                            key = { p.id }
                            participantID = { p.id }>
                            <Button
                                labelKey = { 'lobby.admit' }
                                onClick = { this._onRespondToParticipant(p.id, true) }
                                style = { styles.lobbyButtonAdmit }
                                type = { BUTTON_TYPES.PRIMARY } />
                            {
                                _showChatButton(p)
                                    ? (
                                        <Button
                                            labelKey = { 'lobby.chat' }
                                            onClick = { this._onInitializeLobbyChat(p.id) }
                                            style = { styles.lobbyButtonChat }
                                            type = { BUTTON_TYPES.SECONDARY } />
                                    ) : null
                            }
                            <Button
                                labelKey = { 'lobby.reject' }
                                onClick = { this._onRespondToParticipant(p.id, false) }
                                style = { styles.lobbyButtonReject }
                                type = { BUTTON_TYPES.DESTRUCTIVE } />
                        </ParticipantItem>
                    </View>
                )) }
            </>
        );
    }

    _onRespondToParticipant: (string, boolean) => Function;

    /**
     * Function that constructs a callback for the response handler button.
     *
     * @param {string} id - The id of the knocking participant.
     * @param {boolean} approve - The response for the knocking.
     * @returns {Function}
     */
    _onRespondToParticipant(id, approve) {
        return () => {
            this.props.dispatch(setKnockingParticipantApproval(id, approve));
        };
    }

    _onInitializeLobbyChat: (string) => Function;

    /**
     * Function that constructs a callback for the lobby chat button.
     *
     * @param {string} id - The id of the knocking participant.
     * @returns {Function}
     */
    _onInitializeLobbyChat(id) {
        return () => {
            this.props.dispatch(handleLobbyChatInitialized(id));
            if (this.props._isPollsDisabled) {
                return navigate(screen.conference.chat);
            }

            navigate(screen.conference.chatandpolls.main);
        };
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function _mapStateToProps(state): Object {
    const lobbyEnabled = getLobbyEnabled(state);
    const knockingParticipants = getKnockingParticipants(state);
    const { disablePolls } = state['features/base/config'];

    return {
        _visible: lobbyEnabled && isLocalParticipantModerator(state),
        _showChatButton: participant => showLobbyChatButton(participant)(state),
        _isPollsDisabled: disablePolls,

        // On mobile we only show a portion of the list for screen real estate reasons
        _participants: knockingParticipants.slice(0, 2)
    };
}

export default translate(connect(_mapStateToProps)(KnockingParticipantList));
