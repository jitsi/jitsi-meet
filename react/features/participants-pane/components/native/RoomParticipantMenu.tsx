import React, { PureComponent } from 'react';
import { WithTranslation } from 'react-i18next';
import { Text, TextStyle, View, ViewStyle } from 'react-native';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
import Avatar from '../../../base/avatar/components/Avatar';
import { hideSheet } from '../../../base/dialog/actions';
import BottomSheet from '../../../base/dialog/components/native/BottomSheet';
import { bottomSheetStyles } from '../../../base/dialog/components/native/styles';
import { translate } from '../../../base/i18n/functions';
import { getBreakoutRooms } from '../../../breakout-rooms/functions';
// eslint-disable-next-line lines-around-comment
// @ts-ignore
import SendToBreakoutRoom from '../../../video-menu/components/native/SendToBreakoutRoom';
import styles from '../../../video-menu/components/native/styles';

/**
 * Size of the rendered avatar in the menu.
 */
const AVATAR_SIZE = 24;

interface IProps extends WithTranslation {

    /**
     * The list of all breakout rooms.
     */
    _rooms: Array<any>;

    /**
     * The Redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
     * The jid of the selected participant.
     */
    participantJid: string;

    /**
     * The display name of the selected participant.
     */
    participantName: string;

    /**
     * The room the participant is in.
     */
    room: any;
}

/**
 * Class to implement a popup menu that opens upon long pressing a thumbnail.
 */
class RoomParticipantMenu extends PureComponent<IProps> {
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
    override render() {
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
                <View style = { styles.contextMenuItem as ViewStyle }>
                    <Text style = { styles.contextMenuItemText as ViewStyle }>
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
                    styles.participantNameContainer ] as ViewStyle[] }>
                <Avatar
                    displayName = { participantName }
                    size = { AVATAR_SIZE } />
                <Text style = { styles.participantNameLabel as TextStyle }>
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
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    return {
        _rooms: Object.values(getBreakoutRooms(state))
    };
}

export default translate(connect(_mapStateToProps)(RoomParticipantMenu));
