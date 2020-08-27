// @flow

import React, { Component } from 'react';

import { connect, equals } from '../../../base/redux';
import { SettingsButton } from '../../../settings';
import {
    AudioMuteButton,
    HangupButton,
    VideoMuteButton
} from '../../../toolbox/components';

declare var interfaceConfig: Object;

// XXX: We are not currently using state here, but in the future, when
// interfaceConfig is part of redux we will. This has to be retrieved from the store.
const visibleButtons = new Set(interfaceConfig.TOOLBAR_BUTTONS);

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
                <HangupButton
                    tooltipPosition = 'left'
                    visible = { this._shouldShowButton('hangup') } />
                <AudioMuteButton
                    tooltipPosition = 'left'
                    visible = { this._shouldShowButton('microphone') } />
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
    //
    // NB: We compute the buttons again here because if URL parameters were used to
    // override them we'd miss it.
    const buttons = new Set(interfaceConfig.TOOLBAR_BUTTONS);

    return {
        _visibleButtons: equals(visibleButtons, buttons) ? visibleButtons : buttons
    };
}

export default connect(_mapStateToProps)(Toolbar);
