/* eslint-disable lines-around-comment */
import React, { PureComponent } from 'react';
import { WithTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

// @ts-ignore
import { Avatar } from '../../../base/avatar';
// @ts-ignore
import { BottomSheet, hideSheet } from '../../../base/dialog';
// @ts-ignore
import { bottomSheetStyles } from '../../../base/dialog/components/native/styles';
import { translate } from '../../../base/i18n/functions';
import { connect } from '../../../base/redux/functions';
// @ts-ignore
import { getBreakoutRooms } from '../../../breakout-rooms/functions';
// @ts-ignore
import SendToBreakoutRoom from '../../../video-menu/components/native/SendToBreakoutRoom';
// @ts-ignore
import styles from '../../../video-menu/components/native/styles';

/**
 * Size of the rendered avatar in the menu.
 */
const AVATAR_SIZE = 24;

interface Props extends WithTranslation {

    /**
     * The list of all breakout rooms.
     */
    _rooms: Array<any>,

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     * The jid of the selected participant.
     */
    participantJid: string,

    /**
     * The display name of the selected participant.
     */
    participantName: string,

    /**
     * The room the participant is in.
     */
    room: any
}

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
        const { _rooms, participantJid, room, t } = this.props;
        const buttonProps = {
            afterClick: this._onCancel,
            showLabel: true,
            participantID: participantJid,
            styles: bottomSheetStyles.buttons
        };

        return (
            <BottomSheet
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
        this.props.dispatch(hideSheet());
    }

    /**
     * Function to render the menu's header.
     *
     * @returns {React$Element}
     */
    _renderMenuHeader() {
        const { participantName } = this.props;

        return (
            <View
                style = { [
                    bottomSheetStyles.sheet,
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
function _mapStateToProps(state: any) {
    return {
        _rooms: Object.values(getBreakoutRooms(state))
    };
}

export default translate(connect(_mapStateToProps)(RoomParticipantMenu));
