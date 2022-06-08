import React, { PureComponent } from 'react';
import { Text, View } from 'react-native';

// @ts-ignore
import { Avatar } from '../../../base/avatar';
import { ColorSchemeRegistry } from '../../../base/color-scheme';
// @ts-ignore
import { BottomSheet, isDialogOpen } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
// @ts-ignore
import { StyleType } from '../../../base/styles';
import { getBreakoutRooms } from '../../../breakout-rooms/functions';
import SendToBreakoutRoom from '../../../video-menu/components/native/SendToBreakoutRoom';
import styles from '../../../video-menu/components/native/styles';
import { hideRoomParticipantMenu } from '../../actions.native';


/**
 * Size of the rendered avatar in the menu.
 */
const AVATAR_SIZE = 24;

type Props = {

    /**
     * The color-schemed stylesheet of the BottomSheet.
     */
    _bottomSheetStyles: StyleType,

    /**
     * True if the menu is currently open, false otherwise.
     */
    _isOpen: boolean,

    /**
     * The list of all breakout rooms.
     */
    _rooms: Array<any>,

    /**
     * The room the participant is in.
     */
    room: any,

    /**
     * The jid of the selected participant.
     */
    participantJid: string,

    /**
     * The display name of the selected participant.
     */
    participantName: string,

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     * Translation function.
     */
    t: Function
}

// eslint-disable-next-line prefer-const
let RoomParticipantMenu_;

/**
 * Class to implement a popup menu that opens upon long pressing a thumbnail.
 */
class RoomParticipantMenu extends PureComponent<Props> {
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
        const { _bottomSheetStyles, _rooms, participantJid, room, t } = this.props;
        const buttonProps = {
            afterClick: this._onCancel,
            showLabel: true,
            participantID: participantJid,
            styles: _bottomSheetStyles.buttons
        };

        return (
            <BottomSheet
                onCancel = { this._onCancel }
                renderHeader = { this._renderMenuHeader }
                showSlidingView = { true }>
                <View style = { styles.contextMenuItem }>
                    <Text style = { styles.contextMenuItemText }>
                        {t('breakoutRooms.actions.sendToBreakoutRoom')}
                    </Text>
                </View>
                {_rooms.map(r => room.id !== r.id && (<SendToBreakoutRoom
                    key = { r.id }
                    room = { r }
                    { ...buttonProps } />))}
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
        if (this.props._isOpen) {
            this.props.dispatch(hideRoomParticipantMenu());

            return true;
        }

        return false;
    }

    /**
     * Function to render the menu's header.
     *
     * @returns {React$Element}
     */
    _renderMenuHeader() {
        const { _bottomSheetStyles, participantName } = this.props;

        return (
            <View
                style = { [
                    _bottomSheetStyles.sheet,
                    styles.participantNameContainer ] }>
                <Avatar
                    displayName = { participantName }
                    size = { AVATAR_SIZE } />
                <Text style = { styles.participantNameLabel }>
                    { participantName }
                </Text>
            </View>
        );
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    return {
        _bottomSheetStyles: ColorSchemeRegistry.get(state, 'BottomSheet'),
        _isOpen: isDialogOpen(state, RoomParticipantMenu_),
        _rooms: Object.values(getBreakoutRooms(state))
    };
}

RoomParticipantMenu_ = translate(connect(_mapStateToProps)(RoomParticipantMenu));

export default RoomParticipantMenu_;
