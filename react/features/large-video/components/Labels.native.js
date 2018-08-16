// @flow

import React from 'react';
import { View } from 'react-native';
import { connect } from 'react-redux';

import { JitsiRecordingConstants } from '../../base/lib-jitsi-meet';
import {
    isNarrowAspectRatio,
    makeAspectRatioAware
} from '../../base/responsive-ui';

import AbstractLabels, {
    _abstractMapStateToProps,
    type Props as AbstractLabelsProps
} from './AbstractLabels';
import styles from './styles';

/**
 * The type of the React {@code Component} props of {@link Labels}.
 */
type Props = AbstractLabelsProps & {

    /**
     * The indicator which determines whether the UI is reduced (to accommodate
     * smaller display areas).
     *
     * @private
     */
    _reducedUI: boolean
};

/**
 * A container that renders the conference indicators, if any.
 */
class Labels extends AbstractLabels<Props, *> {
    /**
     * Implements React {@code Component}'s render.
     *
     * @inheritdoc
     */
    render() {
        const wide = !isNarrowAspectRatio(this);
        const { _filmstripVisible, _reducedUI } = this.props;

        return (
            <View
                pointerEvents = 'box-none'
                style = { [
                    styles.indicatorContainer,
                    wide && _filmstripVisible && styles.indicatorContainerWide
                ] }>
                {
                    this._renderRecordingLabel(
                        JitsiRecordingConstants.mode.FILE)
                }
                {
                    this._renderRecordingLabel(
                        JitsiRecordingConstants.mode.STREAM)
                }
                {
                    this._renderTranscribingLabel()
                }
                {/*
                  * Emil, Lyubomir, Nichole, and Zoli said that the Labels
                  * should not be rendered in Picture-in-Picture. Saul argued
                  * that the recording Labels should be rendered. As a temporary
                  * compromise, don't render the VideoQualityLabel at least
                  * because it's not that important.
                  */
                    _reducedUI || this._renderVideoQualityLabel()
                }
            </View>
        );
    }

    _renderRecordingLabel: string => React$Element<*>;

    _renderTranscribingLabel: () => React$Element<*>

    _renderVideoQualityLabel: () => React$Element<*>;
}

/**
 * Maps (parts of) the redux state to the associated
 * {@code Labels}'s props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {{
 *     _filmstripVisible: boolean,
 *     _reducedUI: boolean
 * }}
 */
function _mapStateToProps(state) {
    return {
        ..._abstractMapStateToProps(state),
        _reducedUI: state['features/base/responsive-ui'].reducedUI
    };
}

export default connect(_mapStateToProps)(makeAspectRatioAware(Labels));
