// @flow

import React, { PureComponent } from 'react';
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';

import { Avatar } from '../../../base/avatar';
import { translate } from '../../../base/i18n';
import { isLocalParticipantModerator } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { setKnockingParticipantApproval } from '../../actions';
import { HIDDEN_EMAILS } from '../../constants';
import { getKnockingParticipants, getLobbyEnabled } from '../../functions';

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
     * The Redux Dispatch function.
     */
    dispatch: Function,

    /**
     * Function to be used to translate i18n labels.
     */
    t: Function
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
        const { _participants, _visible, t } = this.props;

        if (!_visible) {
            return null;
        }

        return (
            <ScrollView
                style = { styles.knockingParticipantList }>
                { _participants.map(p => (
                    <View
                        key = { p.id }
                        style = { styles.knockingParticipantListEntry }>
                        <Avatar
                            displayName = { p.name }
                            size = { 48 }
                            url = { p.loadableAvatarUrl } />
                        <View style = { styles.knockingParticipantListDetails }>
                            <Text style = { styles.knockingParticipantListText }>
                                { p.name }
                            </Text>
                            { p.email && !HIDDEN_EMAILS.includes(p.email) && (
                                <Text style = { styles.knockingParticipantListText }>
                                    { p.email }
                                </Text>
                            ) }
                        </View>
                        <TouchableOpacity
                            onPress = { this._onRespondToParticipant(p.id, true) }
                            style = { [
                                styles.knockingParticipantListButton,
                                styles.knockingParticipantListPrimaryButton
                            ] }>
                            <Text style = { styles.knockingParticipantListText }>
                                { t('lobby.allow') }
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress = { this._onRespondToParticipant(p.id, false) }
                            style = { [
                                styles.knockingParticipantListButton,
                                styles.knockingParticipantListSecondaryButton
                            ] }>
                            <Text style = { styles.knockingParticipantListText }>
                                { t('lobby.reject') }
                            </Text>
                        </TouchableOpacity>
                    </View>
                )) }
            </ScrollView>
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

    return {
        _visible: lobbyEnabled && isLocalParticipantModerator(state),

        // On mobile we only show a portion of the list for screen real estate reasons
        _participants: knockingParticipants.slice(0, 2)
    };
}

export default translate(connect(_mapStateToProps)(KnockingParticipantList));
