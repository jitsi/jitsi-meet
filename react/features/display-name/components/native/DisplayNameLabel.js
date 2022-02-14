// @flow

import React, { Component } from 'react';
import { Text, View } from 'react-native';

import {
    getParticipantById,
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
     * True of the label needs to be rendered. False otherwise.
     */
    _render: boolean,

    /**
     * Whether ot not the name is in a container.
     */
    contained?: boolean,

    /**
     * The ID of the participant to render the label for.
     */
    participantId: string
}

/**
 * Renders a label with the display name of the on-stage participant.
 */
class DisplayNameLabel extends Component<Props> {
    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        if (!this.props._render) {
            return null;
        }

        return (
            <View style = { this.props.contained ? styles.displayNamePadding : styles.displayNameBackdrop }>
                <Text
                    numberOfLines = { 1 }
                    style = { styles.displayNameText }>
                    { this.props._participantName }
                </Text>
            </View>
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
    const participant = getParticipantById(state, participantId);
    const isFakeParticipant = participant && participant.isFakeParticipant;

    // Currently we only render the display name if it's not the local
    // participant and there is no video rendered for
    // them.
    const _render = Boolean(participantId)
        && !isFakeParticipant;

    return {
        _participantName:
            getParticipantDisplayName(state, participantId),
        _render
    };
}

export default connect(_mapStateToProps)(DisplayNameLabel);
