// @flow

import React, { Component } from 'react';
import { Text, View } from 'react-native';

import { Avatar } from '../../../base/avatar';
import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { BottomSheet, isDialogOpen } from '../../../base/dialog';
import { getParticipantDisplayName } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { StyleType } from '../../../base/styles';

import { hideRemoteVideoMenu } from '../../actions';

import KickButton from './KickButton';
import MuteButton from './MuteButton';
import PinButton from './PinButton';
import styles from './styles';

/**
 * Size of the rendered avatar in the menu.
 */
const AVATAR_SIZE = 25;

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
     * True if the menu is currently open, false otherwise.
     */
    _isOpen: boolean,

    /**
     * Display name of the participant retreived from Redux.
     */
    _participantDisplayName: string
}

// eslint-disable-next-line prefer-const
let RemoteVideoMenu_;

/**
 * Class to implement a popup menu that opens upon long pressing a thumbnail.
 */
class RemoteVideoMenu extends Component<Props> {
    /**
     * Constructor of the component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onCancel = this._onCancel.bind(this);
    }

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { participant } = this.props;
        const buttonProps = {
            afterClick: this._onCancel,
            showLabel: true,
            participantID: participant.id,
            styles: this.props._bottomSheetStyles
        };

        return (
            <BottomSheet onCancel = { this._onCancel }>
                <View style = { styles.participantNameContainer }>
                    <Avatar
                        participantId = { participant.id }
                        size = { AVATAR_SIZE } />
                    <Text style = { styles.participantNameLabel }>
                        { this.props._participantDisplayName }
                    </Text>
                </View>
                <MuteButton { ...buttonProps } />
                <KickButton { ...buttonProps } />
                <PinButton { ...buttonProps } />
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
    const { participant } = ownProps;

    return {
        _bottomSheetStyles:
            ColorSchemeRegistry.get(state, 'BottomSheet'),
        _isOpen: isDialogOpen(state, RemoteVideoMenu_),
        _participantDisplayName: getParticipantDisplayName(
            state, participant.id)
    };
}

RemoteVideoMenu_ = connect(_mapStateToProps)(RemoteVideoMenu);

export default RemoteVideoMenu_;
