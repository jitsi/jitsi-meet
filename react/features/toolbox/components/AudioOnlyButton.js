import React, { Component } from 'react';
import { connect } from 'react-redux';

import { toggleAudioOnly } from '../../base/conference';

import ToolbarButton from './ToolbarButton';

/**
 * React {@code Component} for toggling audio only mode.
 *
 * @extends Component
 */
class AudioOnlyButton extends Component {
    /**
     * {@code AudioOnlyButton}'s property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Whether or not audio only mode is enabled.
         */
        _audioOnly: React.PropTypes.bool,

        /**
         * Invoked to toggle audio only mode.
         */
        dispatch: React.PropTypes.func,

        /**
         * From which side the button tooltip should appear.
         */
        tooltipPosition: React.PropTypes.string
    }

    /**
     * Initializes a new {@code AudioOnlyButton} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onClick = this._onClick.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const buttonConfiguration = {
            buttonName: 'audioonly',
            classNames: [ 'button', 'icon-visibility' ],
            enabled: true,
            id: 'toolbar_button_audioonly',
            tooltipKey: 'toolbar.audioonly'
        };

        if (this.props._audioOnly) {
            buttonConfiguration.classNames.push('toggled button-active');
        }

        return (
            <ToolbarButton
                button = { buttonConfiguration }
                onClick = { this._onClick }
                tooltipPosition = { this.props.tooltipPosition } />
        );
    }

    /**
     * Dispatches an action to toggle audio only mode.
     *
     * @private
     * @returns {void}
     */
    _onClick() {
        this.props.dispatch(toggleAudioOnly());
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code AudioOnlyButton}'s
 * props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _audioOnly: boolean
 * }}
 */
function _mapStateToProps(state) {
    return {
        _audioOnly: state['features/base/conference'].audioOnly
    };
}

export default connect(_mapStateToProps)(AudioOnlyButton);
