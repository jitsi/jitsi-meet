// @flow

import React, { Component } from 'react';
import { Text, View } from 'react-native';

import {
    getLocalParticipant,
    getParticipantDisplayName,
    shouldRenderParticipantVideo
} from '../../../base/participants';
import { connect } from '../../../base/redux';
import { shouldDisplayTileView } from '../../../video-layout';

import styles from './styles';

type Props = {

    /**
     * The name of the participant to render.
     */
    _participantName: string,

    /**
     * True of the label needs to be rendered. False otherwise.
     */
    _render: boolean
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
            <View style = { styles.displayNameBackdrop }>
                <Text style = { styles.displayNameText }>
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
 * @returns {{
 * }}
 */
function _mapStateToProps(state: Object) {
    const largeVideoParticipantId = state['features/large-video'].participantId;
    const localParticipant = getLocalParticipant(state);

    // Currently we only render the display name if it's not the local
    // participant, we're not in tile view and there is no video rendered for
    // the on-stage participant.
    const _render = localParticipant.id !== largeVideoParticipantId
        && !shouldDisplayTileView(state)
        && !shouldRenderParticipantVideo(state, largeVideoParticipantId);

    return {
        _participantName:
            getParticipantDisplayName(state, largeVideoParticipantId),
        _render
    };
}

export default connect(_mapStateToProps)(DisplayNameLabel);
