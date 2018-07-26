// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { translate } from '../../base/i18n/index';

import { CircularLabel } from '../../base/label/index';
import Tooltip from '@atlaskit/tooltip';

/**
 * The type of the React {@code Component} props of {@link TranscribingLabel}.
 */
type Props = {

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

    /**
     * Boolean value indicating current transcribing status
     */
    _transcribing: boolean
};

/**
 * React Component for displaying a label when a transcriber is in the
 * conference.
 *
 * @extends Component
 */
class TranscribingLabel extends Component<Props> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        if (!this.props._transcribing) {
            return null;
        }

        return (
            <Tooltip
                content = { this.props.t('transcribing.labelToolTip') }
                position = { 'left' }>
                <CircularLabel
                    className = 'recording-label'
                    label = { this.props.t('transcribing.tr') } />
            </Tooltip>
        );
    }

}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code TranscribingLabel} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 * }}
 */
function _mapStateToProps(state) {
    const { isTranscribing } = state['features/transcribing'];

    return {
        _transcribing: isTranscribing
    };
}

export default translate(connect(_mapStateToProps)(TranscribingLabel));
