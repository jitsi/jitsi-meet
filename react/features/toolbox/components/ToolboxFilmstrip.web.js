// @flow

import React, { Component } from 'react';

import { HangupButton } from './buttons';

/**
 * Enumerates the names of toolbar buttons that are supported by
 * {@code ToolboxFilmstrip}.
 */
const VALID_TOOLBAR_BUTTONS = [
    'microphone',
    'camera',
    'fodeviceselection',
    'hangup'
];

declare var interfaceConfig: Object;

/**
 * Implements the conference toolbox on React/Web for filmstrip only mode.
 *
 * @extends Component
 */
class ToolboxFilmstrip extends Component<*> {
    _visibleButtons: Object;

    /**
     * Initializes a new {@code ToolboxFilmstrip} instance.
     *
     * @param {Props} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: Object) {
        super(props);

        this._visibleButtons = new Set(
            interfaceConfig.TOOLBAR_BUTTONS.filter(button =>
                VALID_TOOLBAR_BUTTONS.includes(button)));
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <div className = 'filmstrip-toolbox'>
                { this._shouldShowButton('hangup')
                    && <HangupButton tooltipPosition = 'left' /> }
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
     * @returns {boolean} True if the button should be displayed.
     */
    _shouldShowButton(buttonName) {
        return this._visibleButtons.has(buttonName);
    }
}

export default ToolboxFilmstrip;
