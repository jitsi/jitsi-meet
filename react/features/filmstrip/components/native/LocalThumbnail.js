// @flow

import React, { Component } from 'react';
import { View } from 'react-native';

import { getLocalParticipant } from '../../../base/participants';
import { connect } from '../../../base/redux';

import Thumbnail from './Thumbnail';
import styles from './styles';

type Props = {

    /**
     * The local participant.
     */
    _localParticipant: Object
};

/**
 * Component to render a local thumbnail that can be separated from the
 * remote thumbnails later.
 */
class LocalThumbnail extends Component<Props> {
    /**
     * Implements React Component's render.
     *
     * @inheritdoc
     */
    render() {
        const { _localParticipant } = this.props;

        return (
            <View style = { styles.localThumbnail }>
                <Thumbnail participant = { _localParticipant } />
            </View>
        );
    }
}

/**
 * Maps (parts of) the redux state to the associated {@code LocalThumbnail}'s
 * props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {{
 *     _localParticipant: Participant
 * }}
 */
function _mapStateToProps(state) {
    return {
        /**
         * The local participant.
         *
         * @private
         * @type {Participant}
         */
        _localParticipant: getLocalParticipant(state)
    };
}

export default connect(_mapStateToProps)(LocalThumbnail);
