// @flow

import React, { PureComponent } from 'react';
import { FlatList, Text, View } from 'react-native';
import { Button, withTheme } from 'react-native-paper';

import { translate } from '../../../base/i18n';
import { Icon, IconInviteMore } from '../../../base/icons';
import { getLocalParticipant, getParticipantCountWithFake, getRemoteParticipants } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { normalizeAccents } from '../../../base/util/strings';
import { doInvitePeople } from '../../../invite/actions.native';
import { shouldRenderInviteButton } from '../../functions';

import ClearableInput from './ClearableInput';
import MeetingParticipantItem from './MeetingParticipantItem';
import styles from './styles';


type Props = {

    /**
     * The local participant.
     */
    _localParticipant: Object,

    /**
     * The number of participants in the conference.
     */
    _participantsCount: number,

    /**
     * The remote participants.
     */
    _remoteParticipants: Map<string, Object>,

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
    t: Function,

    /**
     * Theme used for styles.
     */
    theme: Object
}

type State = {
    searchString: string
};

/**
 *  The meeting participant list component.
 */
class MeetingParticipantList extends PureComponent<Props, State> {

    /**
     * Creates new MeetingParticipantList instance.
     *
     * @param {Props} props - The props of the component.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            searchString: ''
        };

        this._keyExtractor = this._keyExtractor.bind(this);
        this._onInvite = this._onInvite.bind(this);
        this._renderParticipant = this._renderParticipant.bind(this);
        this._onSearchStringChange = this._onSearchStringChange.bind(this);
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
        const { _localParticipant, _remoteParticipants } = this.props;
        const { searchString } = this.state;
        const participant = item === _localParticipant?.id ? _localParticipant : _remoteParticipants.get(item);
        const displayName = participant?.name || '';

        if (displayName) {
            const names = normalizeAccents(displayName)
                .toLowerCase()
                .split(' ');
            const lowerCaseSearch = normalizeAccents(searchString).toLowerCase();

            for (const name of names) {
                if (lowerCaseSearch === '' || name.startsWith(lowerCaseSearch)) {
                    return (
                        <MeetingParticipantItem
                            key = { item }
                            participant = { participant } />
                    );
                }
            }
        } else if (displayName === '' && searchString === '') {
            return (
                <MeetingParticipantItem
                    key = { item }
                    participant = { participant } />
            );
        }

        return null;
    }

    _onSearchStringChange: (text: string) => void;

    /**
     * Handles search string changes.
     *
     * @param {string} text - New value of the search string.
     * @returns {void}
     */
    _onSearchStringChange(text: string) {
        this.setState({
            searchString: text
        });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _localParticipant,
            _participantsCount,
            _showInviteButton,
            _sortedRemoteParticipants,
            t
        } = this.props;

        return (
            <View
                style = { styles.meetingListContainer }>
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
                <ClearableInput
                    onChange = { this._onSearchStringChange }
                    placeholder = { t('participantsPane.search') }
                    selectionColor = { this.props.theme.palette.text01 } />
                <FlatList
                    bounces = { false }
                    data = { [ _localParticipant?.id, ..._sortedRemoteParticipants ] }
                    horizontal = { false }
                    keyExtractor = { this._keyExtractor }
                    renderItem = { this._renderParticipant }
                    scrollEnabled = { false }
                    showsHorizontalScrollIndicator = { false }
                    style = { styles.meetingList }
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
    const _remoteParticipants = getRemoteParticipants(state);

    return {
        _participantsCount,
        _remoteParticipants,
        _showInviteButton,
        _sortedRemoteParticipants: remoteParticipants,
        _localParticipant: getLocalParticipant(state)
    };
}

export default translate(connect(_mapStateToProps)(withTheme(MeetingParticipantList)));
