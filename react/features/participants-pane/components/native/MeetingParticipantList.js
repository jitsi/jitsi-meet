// @flow

import React, { PureComponent } from 'react';
import { FlatList, Text, View } from 'react-native';
import { Button } from 'react-native-paper';

import { translate } from '../../../base/i18n';
import { Icon, IconInviteMore } from '../../../base/icons';
import { getLocalParticipant, getParticipantCountWithFake } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { doInvitePeople } from '../../../invite/actions.native';
import { shouldRenderInviteButton } from '../../functions';

import MeetingParticipantItem from './MeetingParticipantItem';
import styles from './styles';

type Props = {

    /**
     * The ID of the local participant.
     */
    _localParticipantId: string,

    /**
     * The number of participants in the conference.
     */
    _participantsCount: number,

    /**
     * Whether or not to show the invite button.
     */
    _showInviteButton: boolean,

    /**
     * The remote participants.
     */
    _sortedRemoteParticipants: Map<string, string>,

    /**
     * The redux dispatch function.
     */
    dispatch: Function,

    /**
     * Translation function.
     */
    t: Function
}

/**
 *  The meeting participant list component.
 */
class MeetingParticipantList extends PureComponent<Props> {

    /**
     * Creates new MeetingParticipantList instance.
     *
     * @param {Props} props - The props of the component.
     */
    constructor(props: Props) {
        super(props);

        this._keyExtractor = this._keyExtractor.bind(this);
        this._onInvite = this._onInvite.bind(this);
        this._renderParticipant = this._renderParticipant.bind(this);
    }

    _keyExtractor: Function;

    /**
     * Returns a key for a passed item of the list.
     *
     * @param {string} item - The user ID.
     * @returns {string} - The user ID.
     */
    _keyExtractor(item) {
        return item;
    }

    _onInvite: () => void;

    /**
     * Handles ivite button presses.
     *
     * @returns {void}
     */
    _onInvite() {
        this.props.dispatch(doInvitePeople());
    }

    /**
     * Renders the "invite more" icon.
     *
     * @returns {ReactElement}
     */
    _renderInviteMoreIcon() {
        return (
            <Icon
                size = { 20 }
                src = { IconInviteMore } />
        );
    }

    _renderParticipant: Object => Object;

    /**
     * Renders a participant.
     *
     * @param {Object} flatListItem - Information about the item to be rendered.
     * @param {string} flatListItem.item - The ID of the participant.
     * @returns {ReactElement}
     */
    _renderParticipant({ item/* , index, separators */ }) {
        return (
            <MeetingParticipantItem
                key = { item }
                participantID = { item } />
        );
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _localParticipantId,
            _participantsCount,
            _showInviteButton,
            _sortedRemoteParticipants,
            t
        } = this.props;

        return (
            <View style = { styles.meetingList }>
                <Text style = { styles.meetingListDescription }>
                    {t('participantsPane.headings.participantsList',
                        { count: _participantsCount })}
                </Text>
                {
                    _showInviteButton
                    && <Button
                        children = { t('participantsPane.actions.invite') }
                        icon = { this._renderInviteMoreIcon }
                        labelStyle = { styles.inviteLabel }
                        mode = 'contained'
                        onPress = { this._onInvite }
                        style = { styles.inviteButton } />
                }
                <FlatList
                    bounces = { false }
                    data = { [ _localParticipantId, ..._sortedRemoteParticipants ] }
                    horizontal = { false }
                    keyExtractor = { this._keyExtractor }
                    renderItem = { this._renderParticipant }
                    showsHorizontalScrollIndicator = { false }
                    windowSize = { 2 } />
            </View>
        );
    }
}

/**
 * Maps (parts of) the redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state): Object {
    const _participantsCount = getParticipantCountWithFake(state);
    const { remoteParticipants } = state['features/filmstrip'];
    const _showInviteButton = shouldRenderInviteButton(state);

    return {
        _participantsCount,
        _showInviteButton,
        _sortedRemoteParticipants: remoteParticipants,
        _localParticipantId: getLocalParticipant(state)?.id
    };
}

export default translate(connect(_mapStateToProps)(MeetingParticipantList));
