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
 * The type of the React {@code Component} state of {@link TranscribingLabel}.
 */
type State = {

    /**
     * Whether or not the {@link TranscribingLabel} should be invisible.
     */
    hidden: boolean
};


/**
 * React Component for displaying a label when a transcriber is in the
 * conference.
 *
 * @extends Component
 */
class TranscribingLabel extends Component<Props, State> {

    /**
     * Initializes a new {@code TranscribingLabel} instance.
     *
     * @param {Props} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            hidden: true
        };
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        if (this.state.hidden) {
            return null;
        }

        return (
            <Tooltip
                content = 'This label indicates that there is a transcriber'
                position = { 'left' }>
                <CircularLabel
                    className = 'recording-label'
                    label = 'TR' />
            </Tooltip>
        );
    }

    /**
     * Notifies this mounted React {@code Component} that it will receive new
     * props.
     *
     * @inheritdoc
     * @param {Object} nextProps - The read-only React {@code Component} props
     * that this instance will receive.
     * @returns {void}
     */
    componentWillReceiveProps(nextProps) {
        this.setState({
            hidden: !nextProps._transcribing
        });
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
