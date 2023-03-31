import React, { PureComponent } from 'react';
import { Text, View } from 'react-native';
import { Divider } from 'react-native-paper';
import { connect } from 'react-redux';

import Avatar from '../../../base/avatar/components/Avatar';
import { hideSheet } from '../../../base/dialog/actions';
import BottomSheet from '../../../base/dialog/components/native/BottomSheet';
import { bottomSheetStyles } from '../../../base/dialog/components/native/styles';
import { KICK_OUT_ENABLED } from '../../../base/flags/constants';
import { getFeatureFlag } from '../../../base/flags/functions';
import { translate } from '../../../base/i18n/functions';
import {
    getParticipantById,
    getParticipantDisplayName,
    isLocalParticipantModerator
} from '../../../base/participants/functions';
import { getBreakoutRooms, getCurrentRoomId } from '../../../breakout-rooms/functions';
import PrivateMessageButton from '../../../chat/components/native/PrivateMessageButton';
import ConnectionStatusButton from '../native/ConnectionStatusButton';

import AskUnmuteButton from './AskUnmuteButton';
import GrantModeratorButton from './GrantModeratorButton';
import KickButton from './KickButton';
import MuteButton from './MuteButton';
import MuteEveryoneElseButton from './MuteEveryoneElseButton';
import MuteVideoButton from './MuteVideoButton';
import PinButton from './PinButton';
import SendToBreakoutRoom from './SendToBreakoutRoom';
import styles from './styles';

// import VolumeSlider from './VolumeSlider';


/**
 * Size of the rendered avatar in the menu.
 */
const AVATAR_SIZE = 24;

type Props = {

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     * The ID of the participant for which this menu opened for.
     */
    participantId: String,

    /**
     * The id of the current room.
     */
    _currentRoomId: String,

    /**
     * Whether or not to display the kick button.
     */
    _disableKick: boolean,

    /**
     * Whether or not to display the send private message button.
     */
    _disablePrivateChat: Boolean,

    /**
     * Whether or not to display the remote mute buttons.
     */
    _disableRemoteMute: boolean,

    /**
     * Whether or not to display the grant moderator button.
     */
    _disableGrantModerator: Boolean,

    /**
     * Whether the participant is present in the room or not.
     */
    _isParticipantAvailable?: boolean,

    /**
     * Whether the local participant is moderator or not.
     */
    _moderator: boolean,

    /**
     * Display name of the participant retrieved from Redux.
     */
    _participantDisplayName: string,

    /**
     * Array containing the breakout rooms.
     */
    _rooms: Array<Object>,

    /**
     * Translation function.
     */
    t: Function
}

/**
 * Class to implement a popup menu that opens upon long pressing a thumbnail.
 */
class RemoteVideoMenu extends PureComponent<Props> {
    /**
     * Constructor of the component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onCancel = this._onCancel.bind(this);
        this._renderMenuHeader = this._renderMenuHeader.bind(this);
    }

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const {
            _disableKick,
            _disablePrivateChat,
            _disableRemoteMute,
            _disableGrantModerator,
            _isParticipantAvailable,
            _moderator,
            _rooms,
            _currentRoomId,
            participantId,
            t
        } = this.props;
        const buttonProps = {
            afterClick: this._onCancel,
            showLabel: true,
            participantID: participantId,
            styles: bottomSheetStyles.buttons
        };

        return (
            <BottomSheet
                renderHeader = { this._renderMenuHeader }
                showSlidingView = { _isParticipantAvailable }>
                <AskUnmuteButton { ...buttonProps } />
                { !_disableRemoteMute && <MuteButton { ...buttonProps } /> }
                <MuteEveryoneElseButton { ...buttonProps } />
                { !_disableRemoteMute && <MuteVideoButton { ...buttonProps } /> }
                <Divider style = { styles.divider } />
                { !_disableKick && <KickButton { ...buttonProps } /> }
                { !_disableGrantModerator && <GrantModeratorButton { ...buttonProps } /> }
                <PinButton { ...buttonProps } />
                { !_disablePrivateChat && <PrivateMessageButton { ...buttonProps } /> }
                <ConnectionStatusButton
                    { ...buttonProps }
                    afterClick = { undefined } />
                {_moderator && _rooms.length > 1 && <>
                    <Divider style = { styles.divider } />
                    <View style = { styles.contextMenuItem }>
                        <Text style = { styles.contextMenuItemText }>
                            {t('breakoutRooms.actions.sendToBreakoutRoom')}
                        </Text>
                    </View>
                    {_rooms.map(room => _currentRoomId !== room.id && (<SendToBreakoutRoom
                        key = { room.id }
                        room = { room }
                        { ...buttonProps } />))}
                </>}
                {/* <VolumeSlider participantID = { participantId } />*/}
            </BottomSheet>
        );
    }

    /**
     * Callback to hide the {@code RemoteVideoMenu}.
     *
     * @private
     * @returns {boolean}
     */
    _onCancel() {
        this.props.dispatch(hideSheet());
    }

    /**
     * Function to render the menu's header.
     *
     * @returns {React$Element}
     */
    _renderMenuHeader() {
        const { participantId } = this.props;

        return (
            <View
                style = { [
                    bottomSheetStyles.sheet,
                    styles.participantNameContainer ] }>
                <Avatar
                    participantId = { participantId }
                    size = { AVATAR_SIZE } />
                <Text style = { styles.participantNameLabel }>
                    { this.props._participantDisplayName }
                </Text>
            </View>
        );
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @param {Object} ownProps - Properties of component.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state, ownProps) {
    const kickOutEnabled = getFeatureFlag(state, KICK_OUT_ENABLED, true);
    const { participantId } = ownProps;
    const { remoteVideoMenu = {}, disableRemoteMute } = state['features/base/config'];
    const isParticipantAvailable = getParticipantById(state, participantId);
    const { disableKick, disablePrivateChat } = remoteVideoMenu;
    const _rooms = Object.values(getBreakoutRooms(state));
    const _currentRoomId = getCurrentRoomId(state);
    const shouldDisableKick = disableKick || !kickOutEnabled;
    const moderator = isLocalParticipantModerator(state);
    const _iAmVisitor = state['features/visitors'].iAmVisitor;

    return {
        _currentRoomId,
        _disableKick: Boolean(shouldDisableKick),
        _disableRemoteMute: Boolean(disableRemoteMute),
        _disablePrivateChat: Boolean(disablePrivateChat) || _iAmVisitor,
        _isParticipantAvailable: Boolean(isParticipantAvailable),
        _moderator: moderator,
        _participantDisplayName: getParticipantDisplayName(state, participantId),
        _rooms
    };
}

export default translate(connect(_mapStateToProps)(RemoteVideoMenu));
