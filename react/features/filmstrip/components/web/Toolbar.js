// @flow

import React, { Component } from 'react';

import { SettingsButton } from '../../../settings';
import {
    AudioMuteButton,
    HangupButton,
    VideoMuteButton
} from '../../../toolbox';

declare var interfaceConfig: Object;

// XXX: We are not currently using state here, but in the future, when
// interfaceConfig is part of redux we will. This has to be retrieved from the store.
const visibleButtons = new Set(interfaceConfig.TOOLBAR_BUTTONS);

/**
 * Implements the conference toolbar on React/Web for filmstrip-only mode.
 *
 * @extends Component
 */
class Toolbar extends Component<*> {
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
        return visibleButtons.has(buttonName);
    }
}

export default Toolbar;
