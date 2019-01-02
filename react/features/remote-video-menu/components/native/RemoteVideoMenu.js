// @flow

import React, { Component } from 'react';
import { Text, View } from 'react-native';
import { connect } from 'react-redux';

import {
    BottomSheet,
    bottomSheetItemStylesCombined
} from '../../../base/dialog';
import { getParticipantDisplayName } from '../../../base/participants';

import { hideRemoteVideoMenu } from '../../actions';

import KickButton from './KickButton';
import MuteButton from './MuteButton';
import styles from './styles';

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
            participant: this.props.participant,
            styles: bottomSheetItemStylesCombined
        };

        return (
            <BottomSheet onCancel = { this._onCancel }>
                <View style = { styles.participantNameContainer }>
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
 *      _participantDisplayName: string
 *  }}
 */
function _mapStateToProps(state, ownProps) {
    const { id } = ownProps.participant;

    return {
        _participantDisplayName: getParticipantDisplayName(state, id)
    };
}

export default connect(_mapStateToProps)(RemoteVideoMenu);
