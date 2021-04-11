// @flow

import React, { Component } from 'react';

import { translate } from '../../base/i18n/index';
import { Label } from '../../base/label/index';
import { connect } from '../../base/redux';
import { Tooltip } from '../../base/tooltip';


/**
 * The type of the React {@code Component} props of {@link LocalRecordingLabel}.
 */
type Props = {

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

    /**
     * Whether local recording is engaged or not.
     */
    isEngaged: boolean
};

/**
 * React Component for displaying a label when local recording is engaged.
 *
 * @extends Component
 */
class LocalRecordingLabel extends Component<Props> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        if (!this.props.isEngaged) {
            return null;
        }

        return (
            <Tooltip
                content = { this.props.t('localRecording.labelToolTip') }
                position = { 'bottom' }>
                <Label
                    className = 'local-rec'
                    text = { this.props.t('localRecording.label') } />
            </Tooltip>
        );
    }

}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code LocalRecordingLabel} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 * }}
 */
function _mapStateToProps(state) {
    const { isEngaged } = state['features/local-recording'];

    return {
        isEngaged
    };
}

export default translate(connect(_mapStateToProps)(LocalRecordingLabel));
