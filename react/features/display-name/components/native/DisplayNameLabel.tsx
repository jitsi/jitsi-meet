import * as React from 'react';
import { Text, View } from 'react-native';

import {
    getParticipantById,
    getParticipantDisplayName
} from '../../../base/participants/functions';
import { connect } from '../../../base/redux/functions';

import styles from './styles';

type Props = {

    /**
     * The name of the participant to render.
     */
    _participantName: string;

    /**
     * True of the label needs to be rendered. False otherwise.
     */
    _render: boolean;

    /**
     * Whether ot not the name is in a container.
     */
    contained?: boolean;

    /**
     * The ID of the participant to render the label for.
     */
    participantId: string;
}

/**
 * Renders a label with the display name of the on-stage participant.
 */
class DisplayNameLabel extends React.Component<Props> {
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
 * @param {any} state - The Redux state.
 * @param {Props} ownProps - The own props of the component.
 * @returns {Props}
 */
function _mapStateToProps(state: any, ownProps) {
    const participant = getParticipantById(state, ownProps.participantId);

    return {
        _participantName: getParticipantDisplayName(state, ownProps.participantId),
        _render: participant && (!participant?.local || ownProps.contained) && !participant?.isFakeParticipant
    };
}

export default connect(_mapStateToProps)(DisplayNameLabel);
