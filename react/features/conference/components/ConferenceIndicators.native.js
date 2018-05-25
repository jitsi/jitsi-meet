// @flow
import React, { Component } from 'react';
import { View } from 'react-native';
import { connect } from 'react-redux';

import { JitsiRecordingConstants } from '../../base/lib-jitsi-meet';
import {
    isNarrowAspectRatio,
    makeAspectRatioAware
} from '../../base/responsive-ui';
import { RecordingLabel } from '../../recording';
import { VideoQualityLabel } from '../../video-quality';

import styles from './styles';

type Props = {

    /**
     * The indicator which determines whether the filmstrip is visible.
     */
    _filmstripVisible: boolean
};

/**
 * A container that renders the conference indicators, if any.
 */
class ConferenceIndicators extends Component<Props> {
    /**
     * Implements React {@code Component}'s render.
     *
     * @inheritdoc
     */
    render() {
        const _wide = !isNarrowAspectRatio(this);
        const { _filmstripVisible } = this.props;

        return (
            <View
                style = { [
                    styles.indicatorContainer,
                    _wide && _filmstripVisible && styles.indicatorContainerWide
                ] }>
                <RecordingLabel
                    mode = { JitsiRecordingConstants.mode.FILE } />
                <RecordingLabel
                    mode = { JitsiRecordingConstants.mode.STREAM } />
                <VideoQualityLabel />
            </View>
        );
    }

}

/**
 * Maps (parts of) the redux state to the associated
 * {@code ConferenceIndicators}'s props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {{
 *     _filmstripVisible: boolean
 * }}
 */
function _mapStateToProps(state) {
    const { length: participantCount } = state['features/base/participants'];
    const { visible } = state['features/filmstrip'];

    return {
        /**
         * The indicator which determines whether the filmstrip is visible.
         *
         * @private
         * @type {boolean}
         */
        _filmstripVisible: visible && participantCount > 1
    };
}

export default connect(_mapStateToProps)(
    makeAspectRatioAware(ConferenceIndicators)
);
