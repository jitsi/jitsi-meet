// @flow
import React, { Component } from 'react';

// We need to reference these files directly to avoid loading things that are not available
// in this environment (e.g. JitsiMeetJS or interfaceConfig)
import { IconHangup } from '../base/icons';
import type { Props } from '../base/toolbox/components/AbstractButton';

import ToolbarButton from './ToolbarButton';

const { api } = window.alwaysOnTop;

/**
 * Stateless hangup button for the Always-on-Top windows.
 */
export default class HangupButton extends Component<Props, *> {

    accessibilityLabel = 'Hangup';
    icon = IconHangup;

    /**
     * Initializes a new {@code HangupButton} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code HangupButton} instance with.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onClick = this._onClick.bind(this);
    }

    _onClick: () => {};

    /**
     * Handles clicking / pressing the button, and disconnects the conference.
     *
     * @protected
     * @returns {void}
     */
    _onClick() {
        api.executeCommand('hangup');
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (<ToolbarButton
            accessibilityLabel = { this.accessibilityLabel }
            customClass = 'hangup-button'
            icon = { this.icon }
            onClick = { this._onClick } />);
    }
}
