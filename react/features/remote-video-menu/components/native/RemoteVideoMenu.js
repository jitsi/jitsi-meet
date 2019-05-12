// @flow

import React, { Component } from 'react';
import { Text, View } from 'react-native';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import {
    BottomSheet
} from '../../../base/dialog';
import {
    Avatar,
    getAvatarURL,
    getParticipantDisplayName
} from '../../../base/participants';
import { connect } from '../../../base/redux';
import { StyleType } from '../../../base/styles';

import { hideRemoteVideoMenu } from '../../actions';

import KickButton from './KickButton';
import MuteButton from './MuteButton';
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
     * URL of the avatar of the participant.
     */
    _avatarURL: string,

    /**
     * The color-schemed stylesheet of the BottomSheet.
     */
    _bottomSheetStyles: StyleType,

    /**
     * Display name of the participant retreived from Redux.
     */
    _participantDisplayName: string
}

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
        const buttonProps = {
            afterClick: this._onCancel,
            showLabel: true,
            participantID: this.props.participant.id,
            styles: this.props._bottomSheetStyles
        };

        return (
            <BottomSheet onCancel = { this._onCancel }>
                <View style = { styles.participantNameContainer }>
                    <Avatar
                        size = { AVATAR_SIZE }
                        uri = { this.props._avatarURL } />
                    <Text style = { styles.participantNameLabel }>
                        { this.props._participantDisplayName }
                    </Text>
                </View>
                <MuteButton { ...buttonProps } />
                <KickButton { ...buttonProps } />
            </BottomSheet>
        );
    }

    _onCancel: () => void;

    /**
     * Callback to hide the {@code RemoteVideoMenu}.
     *
     * @private
     * @returns {void}
     */
    _onCancel() {
        this.props.dispatch(hideRemoteVideoMenu());
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @param {Object} ownProps - Properties of component.
 * @private
 * @returns {{
 *      _avatarURL: string,
 *      _bottomSheetStyles: StyleType,
 *      _participantDisplayName: string
 *  }}
 */
function _mapStateToProps(state, ownProps) {
    const { participant } = ownProps;

    return {
        _avatarURL: getAvatarURL(participant),
        _bottomSheetStyles:
            ColorSchemeRegistry.get(state, 'BottomSheet'),
        _participantDisplayName: getParticipantDisplayName(
            state, participant.id)
    };
}

export default connect(_mapStateToProps)(RemoteVideoMenu);
