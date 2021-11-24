// @flow

import { PureComponent } from 'react';

import { isLocalParticipantModerator } from '../../base/participants';
import { handleChallengeResponseInitialized } from '../../chat/actions.any';
import { navigate } from '../../conference/components/native/ConferenceNavigationContainerRef';
import { screen } from '../../conference/components/native/routes';
import { setKnockingParticipantApproval } from '../actions';
import { getKnockingParticipants, getLobbyEnabled } from '../functions';

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
     * The Redux Dispatch function.
     */
    dispatch: Function,

    /**
     * Function to be used to translate i18n labels.
     */
    t: Function,

    /**
     * Checks the state of current lobby messaging.
     */
     _challengeResponseIsActive: boolean,

    /**
     * The current challenge-response recipient.
     */
     _challengeResponseRecipient: Object,

    /**
     * The lobby local id of the current moderator.
     */
     _lobbyLocalId: string,

    /**
     * Config setting for enabling challenge-response feature.
     */
     _enableChallengeResponseInLobby: boolean,

     /**
      * True if the polls feature is disabled.
      */
     _isPollsDisabled: boolean
};

/**
 * Abstract class to encapsulate the platform common code of the {@code KnockingParticipantList}.
 */
export default class AbstractKnockingParticipantList<P: Props = Props> extends PureComponent<P> {
    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props: P) {
        super(props);

        this._onRespondToParticipant = this._onRespondToParticipant.bind(this);
        this._onInitializeChallengeResponseChat = this._onInitializeChallengeResponseChat.bind(this);
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

    _onInitializeChallengeResponseChat: (string) => Function;

    /**
     * Function that constructs a callback for the challenge response chat button.
     *
     * @param {string} id - The id of the knocking participant.
     * @returns {Function}
     */
    _onInitializeChallengeResponseChat(id) {
        return () => {
            this.props.dispatch(handleChallengeResponseInitialized(id));
            this.props._isPollsDisabled
                ? navigate(screen.conference.chat)
                : navigate(screen.conference.chatandpolls.main);

        };
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
export function mapStateToProps(state: Object): $Shape<Props> {
    const lobbyEnabled = getLobbyEnabled(state);
    const knockingParticipants = getKnockingParticipants(state);
    const { challengeResponseIsActive, challengeResponseRecipient } = state['features/chat'];
    const { conference } = state['features/base/conference'];
    const { enableChallengeResponseInLobby = true } = state['features/base/config'];
    const { disablePolls } = state['features/base/config'];

    return {
        _participants: knockingParticipants,
        _visible: lobbyEnabled && isLocalParticipantModerator(state)
          && Boolean(knockingParticipants && knockingParticipants.length),
        _challengeResponseIsActive: challengeResponseIsActive,
        _challengeResponseRecipient: challengeResponseRecipient,
        _lobbyLocalId: conference && conference.getLobbyLocalId(),
        _enableChallengeResponseInLobby: enableChallengeResponseInLobby,
        _isPollsDisabled: disablePolls
    };
}
