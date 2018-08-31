// @flow

import React from 'react';
import { View } from 'react-native';
import { connect } from 'react-redux';

import { JitsiRecordingConstants } from '../../base/lib-jitsi-meet';
import {
    isNarrowAspectRatio,
    makeAspectRatioAware
} from '../../base/responsive-ui';
import { isFilmstripVisible } from '../../filmstrip';

import AbstractLabels, { type Props } from './AbstractLabels';
import styles from './styles';

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
        const { _filmstripVisible } = this.props;

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
                    this._renderVideoQualityLabel()
                }
            </View>
        );
    }

    _renderRecordingLabel: string => React$Element<*>;

    _renderVideoQualityLabel: () => React$Element<*>;
}

/**
 * Maps (parts of) the redux state to the associated
 * {@code Labels}'s props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {{
 *     _filmstripVisible: boolean
 * }}
 */
function _mapStateToProps(state) {
    return {
        /**
         * The indicator which determines whether the filmstrip is visible.
         *
         * @private
         * @type {boolean}
         */
        _filmstripVisible: isFilmstripVisible(state)
    };
}

export default connect(_mapStateToProps)(makeAspectRatioAware(Labels));
