// @flow

import React, { Component } from 'react';
import { Text } from 'react-native';

import {
    getParticipantDisplayName
} from '../../../base/participants';
import { connect } from '../../../base/redux';

import styles from './styles';

type Props = {

    /**
     * The name of the participant to render.
     */
    _participantName: string,

    /**
     * The ID of the participant to render the label for.
     */
    participantId: string
}

/**
 * Renders a label with the display name of the on-stage participant.
 */
class NameLabel extends Component<Props> {
    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {

        return (
                <Text style = { styles.displayNameTextBottom }>
                    { this.props._participantName }
                </Text>
        );
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The own props of the component.
 * @returns {{
 * }}
 */
function _mapStateToProps(state: Object, ownProps: Props) {
    const { participantId } = ownProps;

    return {
        _participantName:
            getParticipantDisplayName(state, participantId)
    };
}

export default connect(_mapStateToProps)(NameLabel);
