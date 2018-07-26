// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { translate } from '../../base/i18n/index';

import { ToolbarButton } from '../../toolbox/';

import { dialTranscriber, stopTranscribing } from '../actions';
import { createToolbarEvent, sendAnalytics } from '../../analytics';


/**
 * The type of the React {@code Component} props of {@link TranscribingLabel}.
 */
type Props = {

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

    /**
     * Invoked to Dispatch an Action to the redux store.
     */
    dispatch: Function,

    /**
     * Boolean value indicating current transcribing status
     */
    _transcribing: boolean,

    /**
     * Boolean value indicating current dialing status
     */
    _dialing: boolean
};

/**
 * React Component for displaying a label when a transcriber is in the
 * conference.
 *
 * @extends Component
 */
class ClosedCaptionButton extends Component<Props> {

    /**
     * Initializes a new {@code ClosedCaptionButton} instance.
     *
     * @param {Props} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onToggleButton = this._onToggleButton.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _dialing, _transcribing, t } = this.props;
        const iconClass = `icon-closed_caption ${_dialing || _transcribing
            ? 'toggled' : ''}`;

        return (
            <ToolbarButton
                accessibilityLabel
                    = { t('toolbar.accessibilityLabel.cc') }
                iconName = { iconClass }
                onClick = { this._onToggleButton }
                tooltip = { t('transcribing.ccButtonTooltip') } />
        );
    }

    _onToggleButton: () => void;

    /**
     * Dispatch actions for starting or stopping transcription, based on
     * current state.
     *
     * @private
     * @returns {void}
     */
    _onToggleButton() {
        const { _transcribing, _dialing, dispatch } = this.props;

        sendAnalytics(createToolbarEvent(
            'transcribing.ccButton',
            {
                'is_transcribing': Boolean(_transcribing),
                'is_dialing': Boolean(_dialing)
            }));

        if (_dialing) {
            return;
        }

        if (_transcribing) {
            dispatch(stopTranscribing());
        } else {
            dispatch(dialTranscriber());
        }
    }

}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code ClosedCaptionButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 * }}
 */
function _mapStateToProps(state) {
    const { isTranscribing, isDialing } = state['features/transcribing'];

    return {
        _transcribing: isTranscribing,
        _dialing: isDialing
    };
}

export default translate(connect(_mapStateToProps)(ClosedCaptionButton));
