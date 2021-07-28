// @flow

import React, { PureComponent } from 'react';
import { Text, View } from 'react-native';
import { Divider } from 'react-native-paper';

import { Avatar } from '../../../base/avatar';
import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { BottomSheet, isDialogOpen } from '../../../base/dialog';
import { KICK_OUT_ENABLED, getFeatureFlag } from '../../../base/flags';
import {
    getLocalParticipant,
    getParticipantDisplayName, getRemoteParticipants
} from '../../../base/participants';
import { connect } from '../../../base/redux';
import { StyleType } from '../../../base/styles';
import { PrivateMessageButton } from '../../../chat';
import { hideRemoteVideoMenu } from '../../actions.native';

import GrantModeratorButton from './GrantModeratorButton';
import KickButton from './KickButton';
import MuteButton from './MuteButton';
import MuteEveryoneElseButton from './MuteEveryoneElseButton';
import MuteVideoButton from './MuteVideoButton';
import PinButton from './PinButton';
import VolumeSlider from './VolumeSlider';
import styles from './styles';

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
     * The participant for which this menu opened for.
     */
    participant: Object,

    /**
     * The color-schemed stylesheet of the BottomSheet.
     */
    _bottomSheetStyles: StyleType,

    /**
     * Whether or not to display the kick button.
     */
    _disableKick: boolean,

    /**
     * Whether or not to display the remote mute buttons.
     */
    _disableRemoteMute: boolean,

    /**
     * Whether or not to display the grant moderator button.
     */
    _disableGrantModerator: Boolean,

    /**
     * True if the menu is currently open, false otherwise.
     */
    _isOpen: boolean,

    /**
     * Whether the participant is present in the room or not.
     */
    _isParticipantIDAvailable?: boolean,

    /**
     * Display name of the participant retrieved from Redux.
     */
    _participantDisplayName: string,

    /**
     * The ID of the participant.
     */
    _participantID: ?string,
}

// eslint-disable-next-line prefer-const
let RemoteVideoMenu_;

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
            _disableRemoteMute,
            _disableGrantModerator,
            _isParticipantIDAvailable,
            _participantID,
            participant
        } = this.props;
        const buttonProps = {
            afterClick: this._onCancel,
            showLabel: true,
            participantID: participant.id,
            styles: this.props._bottomSheetStyles.buttons
        };

        return (
            <BottomSheet
                onCancel = { this._onCancel }
                renderHeader = { this._renderMenuHeader }
                showSlidingView = { _isParticipantIDAvailable }>
                { !_disableRemoteMute && <MuteButton { ...buttonProps } /> }
                <MuteEveryoneElseButton { ...buttonProps } />
                { !_disableRemoteMute && <MuteVideoButton { ...buttonProps } /> }
                <Divider style = { styles.divider } />
                { !_disableKick && <KickButton { ...buttonProps } /> }
                { !_disableGrantModerator && <GrantModeratorButton { ...buttonProps } /> }
                <PinButton { ...buttonProps } />
                <PrivateMessageButton { ...buttonProps } />
                <Divider style = { styles.divider } />
                <VolumeSlider participantID = { _participantID } />
            </BottomSheet>
        );
    }

    _onCancel: () => boolean;

    /**
     * Callback to hide the {@code RemoteVideoMenu}.
     *
     * @private
     * @returns {boolean}
     */
    _onCancel() {
        if (this.props._isOpen) {
            this.props.dispatch(hideRemoteVideoMenu());

            return true;
        }

        return false;
    }

    _renderMenuHeader: () => React$Element<any>;

    /**
     * Function to render the menu's header.
     *
     * @returns {React$Element}
     */
    _renderMenuHeader() {
        const { _bottomSheetStyles, participant } = this.props;

        return (
            <View
                style = { [
                    _bottomSheetStyles.sheet,
                    styles.participantNameContainer ] }>
                <Avatar
                    participantId = { participant.id }
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
    const { participant } = ownProps;
    const participantIDS = [];

    const { remoteVideoMenu = {}, disableRemoteMute } = state['features/base/config'];
    let { disableKick } = remoteVideoMenu;
    const localParticipant = getLocalParticipant(state);
    const remoteParticipants = getRemoteParticipants(state);

    localParticipant && participantIDS.push(localParticipant?.id);

    remoteParticipants.forEach(p => {
        participantIDS.push(p?.id);
    });

    const isParticipantIDAvailable = participantIDS.find(partID => partID === participant.id);

    disableKick = disableKick || !kickOutEnabled;

    return {
        _bottomSheetStyles: ColorSchemeRegistry.get(state, 'BottomSheet'),
        _disableKick: Boolean(disableKick),
        _disableRemoteMute: Boolean(disableRemoteMute),
        _isOpen: isDialogOpen(state, RemoteVideoMenu_),
        _isParticipantIDAvailable: Boolean(isParticipantIDAvailable),
        _participantDisplayName: getParticipantDisplayName(state, participant.id),
        _participantID: participant.id
    };
}

RemoteVideoMenu_ = connect(_mapStateToProps)(RemoteVideoMenu);

export default RemoteVideoMenu_;
