// @flow

import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n';
import { CircularLabel } from '../../base/label';
import { JitsiRecordingConstants } from '../../base/lib-jitsi-meet';
import { combineStyles } from '../../base/styles';

import AbstractRecordingLabel, {
    type Props as AbstractProps,
    _abstractMapStateToProps
} from './AbstractRecordingLabel';
import styles from './styles';

type Props = AbstractProps & {

    /**
     * Style of the component passed as props.
     */
    style: ?Object
};

/**
 * Implements a React {@link Component} which displays the current state of
 * conference recording.
 *
 * @extends {Component}
 */
class RecordingLabel extends AbstractRecordingLabel<Props, *> {

    /**
     * Implements React {@code Component}'s render.
     *
     * @inheritdoc
     */
    render() {
        const { _visible, mode, style, t } = this.props;

        if (!_visible) {
            return null;
        }

        let labelKey;
        let indicatorStyle;

        switch (mode) {
        case JitsiRecordingConstants.mode.STREAM:
            labelKey = 'recording.live';
            indicatorStyle = styles.indicatorLive;
            break;
        case JitsiRecordingConstants.mode.FILE:
            labelKey = 'recording.rec';
            indicatorStyle = styles.indicatorRecording;
            break;
        default:
            // Invalid mode is passed to the component.
            return null;
        }

        return (
            <CircularLabel
                label = { t(labelKey) }
                style = {
                    combineStyles(indicatorStyle, style)
                } />
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code RecordingLabel}'s props.
 *
 * NOTE: This component has no props other than the abstract ones but keeping
 * the coding style the same for consistency reasons.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The component's own props.
 * @private
 * @returns {{
 * }}
 */
function _mapStateToProps(state: Object, ownProps: Object) {
    return {
        ..._abstractMapStateToProps(state, ownProps)
    };
}

export default translate(connect(_mapStateToProps)(RecordingLabel));
