// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import { SettingsButton } from '../../../settings';
import {
    AudioMuteButton,
    HangupButton,
    VideoMuteButton
} from '../../../toolbox';

declare var interfaceConfig: Object;

/**
 * The type of the React {@code Component} props of {@link Toolbar}.
 */
type Props = {

    /**
     * The set of buttons which should be visible in this {@code Toolbar}.
     */
    _visibleButtons: Set<string>
};

/**
 * Implements the conference toolbar on React/Web for filmstrip-only mode.
 *
 * @extends Component
 */
class Toolbar extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <div
                className = 'filmstrip-toolbox'
                id = 'new-toolbox'>
                <AudioMuteButton
                    tooltipPosition = 'left'
                    visible = { this._shouldShowButton('microphone') } />
                <HangupButton
                    tooltipPosition = 'left'
                    visible = { this._shouldShowButton('hangup') } />
                <VideoMuteButton
                    tooltipPosition = 'left'
                    visible = { this._shouldShowButton('camera') } />
                <SettingsButton
                    tooltipPosition = 'left'
                    visible = { this._shouldShowButton('fodeviceselection') } />
            </div>
        );
    }

    _shouldShowButton: (string) => boolean;

    /**
     * Returns if a button name has been explicitly configured to be displayed.
     *
     * @param {string} buttonName - The name of the button, as expected in
     * {@link intefaceConfig}.
     * @private
     * @returns {boolean} True if the button should be displayed, false
     * otherwise.
     */
    _shouldShowButton(buttonName) {
        return this.props._visibleButtons.has(buttonName);
    }
}

/**
 * Maps (parts of) the redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _visibleButtons: Set<string>
 * }}
 */
function _mapStateToProps(state): Object { // eslint-disable-line no-unused-vars
    // XXX: We are not currently using state here, but in the future, when
    // interfaceConfig is part of redux we will.

    return {
        _visibleButtons: new Set(interfaceConfig.TOOLBAR_BUTTONS)
    };
}

export default connect(_mapStateToProps)(Toolbar);
