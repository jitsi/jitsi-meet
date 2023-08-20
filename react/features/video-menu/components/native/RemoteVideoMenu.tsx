/* eslint-disable lines-around-comment*/

import React, { PureComponent } from 'react';
import { Text, TextStyle, View, ViewStyle } from 'react-native';
import { Divider } from 'react-native-paper';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
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
import { getBreakoutRooms, getCurrentRoomId, isInBreakoutRoom } from '../../../breakout-rooms/functions';
import { IRoom } from '../../../breakout-rooms/types';
import PrivateMessageButton from '../../../chat/components/native/PrivateMessageButton';

import AskUnmuteButton from './AskUnmuteButton';
import ConnectionStatusButton from './ConnectionStatusButton';
import GrantModeratorButton from './GrantModeratorButton';
import KickButton from './KickButton';
import MuteButton from './MuteButton';
import MuteEveryoneElseButton from './MuteEveryoneElseButton';
import MuteVideoButton from './MuteVideoButton';
import PinButton from './PinButton';
import SendToBreakoutRoom from './SendToBreakoutRoom';
import VolumeSlider from './VolumeSlider';
import styles from './styles';


/**
 * Size of the rendered avatar in the menu.
 */
const AVATAR_SIZE = 24;

interface IProps {

    /**
     * The id of the current room.
     */
    _currentRoomId: string;

    /**
     * Whether or not to display the grant moderator button.
     */
    _disableGrantModerator: boolean;

    /**
     * Whether or not to display the kick button.
     */
    _disableKick: boolean;

    /**
     * Whether or not to display the send private message button.
     */
    _disablePrivateChat: boolean;

    /**
     * Whether or not to display the remote mute buttons.
     */
    _disableRemoteMute: boolean;

    /**
     * Whether or not the current room is a breakout room.
     */
    _isBreakoutRoom: boolean;

    /**
     * Whether the participant is present in the room or not.
     */
    _isParticipantAvailable?: boolean;

    /**
     * Whether the local participant is moderator or not.
     */
    _moderator: boolean;

    /**
     * Display name of the participant retrieved from Redux.
     */
    _participantDisplayName: string;

    /**
     * Array containing the breakout rooms.
     */
    _rooms: Array<IRoom>;

    /**
     * The Redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
     * The ID of the participant for which this menu opened for.
     */
    participantId: string;

    /**
     * Translation function.
     */
    t: Function;
}

/**
 * Class to implement a popup menu that opens upon long pressing a thumbnail.
 */
class RemoteVideoMenu extends PureComponent<IProps> {
    /**
     * Constructor of the component.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
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
            _isBreakoutRoom,
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

        const connectionStatusButtonProps = {
            ...buttonProps,
            afterClick: undefined
        };

        return (
            <BottomSheet
                renderHeader = { this._renderMenuHeader }
                showSlidingView = { _isParticipantAvailable }>
                <AskUnmuteButton { ...buttonProps } />
                { !_disableRemoteMute && <MuteButton { ...buttonProps } /> }
                <MuteEveryoneElseButton { ...buttonProps } />
                { !_disableRemoteMute && <MuteVideoButton { ...buttonProps } /> }
                {/* @ts-ignore */}
                <Divider style = { styles.divider as ViewStyle } />
                { !_disableKick && <KickButton { ...buttonProps } /> }
                { !_disableGrantModerator && !_isBreakoutRoom && <GrantModeratorButton { ...buttonProps } /> }
                <PinButton { ...buttonProps } />
                { !_disablePrivateChat && <PrivateMessageButton { ...buttonProps } /> }
                <ConnectionStatusButton { ...connectionStatusButtonProps } />
                {_moderator && _rooms.length > 1 && <>
                    {/* @ts-ignore */}
                    <Divider style = { styles.divider as ViewStyle } />
                    <View style = { styles.contextMenuItem as ViewStyle }>
                        <Text style = { styles.contextMenuItemText as TextStyle }>
                            {t('breakoutRooms.actions.sendToBreakoutRoom')}
                        </Text>
                    </View>
                    {_rooms.map(room => _currentRoomId !== room.id && (<SendToBreakoutRoom
                        key = { room.id }
                        room = { room }
                        { ...buttonProps } />))}
                </>}
                <VolumeSlider participantID = { participantId } />
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
                    styles.participantNameContainer ] as ViewStyle[] }>
                <Avatar
                    participantId = { participantId }
                    size = { AVATAR_SIZE } />
                <Text style = { styles.participantNameLabel as TextStyle }>
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
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState, ownProps: any) {
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
    const _isBreakoutRoom = isInBreakoutRoom(state);

    return {
        _currentRoomId,
        _disableKick: Boolean(shouldDisableKick),
        _disableRemoteMute: Boolean(disableRemoteMute),
        _disablePrivateChat: Boolean(disablePrivateChat) || _iAmVisitor,
        _isBreakoutRoom,
        _isParticipantAvailable: Boolean(isParticipantAvailable),
        _moderator: moderator,
        _participantDisplayName: getParticipantDisplayName(state, participantId),
        _rooms
    };
}

export default translate(connect(_mapStateToProps)(RemoteVideoMenu));
