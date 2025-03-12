import React, { Component } from 'react';
import { View, ViewStyle } from 'react-native';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { IconRaiseHand } from '../../../base/icons/svg';
import { getParticipantById, hasRaisedHand } from '../../../base/participants/functions';
import BaseIndicator from '../../../base/react/components/native/BaseIndicator';

import styles from './styles';

export interface IProps {

    /**
     * True if the hand is raised for this participant.
     */
    _raisedHand?: boolean;

    /**
     * The participant id who we want to render the raised hand indicator
     * for.
     */
    participantId: string;
}


/**
 * Thumbnail badge showing that the participant would like to speak.
 *
 * @augments Component
 */
class RaisedHandIndicator extends Component<IProps> {

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    override render() {
        if (!this.props._raisedHand) {
            return null;
        }

        return this._renderIndicator();
    }

    /**
     * Renders the platform specific indicator element.
     *
     * @returns {React$Element<*>}
     */
    _renderIndicator() {
        return (
            <View style = { styles.raisedHandIndicator as ViewStyle }>
                <BaseIndicator
                    icon = { IconRaiseHand }
                    iconStyle = { styles.raisedHandIcon } />
            </View>
        );
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {IProps} ownProps - The own props of the component.
 * @returns {Object}
 */
function _mapStateToProps(state: IReduxState, ownProps: IProps) {
    const participant = getParticipantById(state, ownProps.participantId);

    return {
        _raisedHand: hasRaisedHand(participant)
    };
}

export default connect(_mapStateToProps)(RaisedHandIndicator);
