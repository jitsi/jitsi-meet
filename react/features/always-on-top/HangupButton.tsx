import React, { Component } from 'react';

// We need to reference these files directly to avoid loading things that are not available
// in this environment (e.g. JitsiMeetJS or interfaceConfig)
import { DEFAULT_ICON } from '../base/icons/svg/constants';
import { IProps } from '../base/toolbox/components/AbstractButton';

import ToolbarButton from './ToolbarButton';

const { api } = window.alwaysOnTop;

type Props = Partial<IProps>;

/**
 * Stateless hangup button for the Always-on-Top windows.
 */
export default class HangupButton extends Component<Props> {

    accessibilityLabel = 'Hangup';
    icon = DEFAULT_ICON.IconHangup;

    /**
     * Initializes a new {@code HangupButton} instance.
     *
     * @param {IProps} props - The React {@code Component} props to initialize
     * the new {@code HangupButton} instance with.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onClick = this._onClick.bind(this);
    }

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
    override render() {
        return (
            <ToolbarButton
                accessibilityLabel = { this.accessibilityLabel }
                customClass = 'hangup-button'
                icon = { this.icon }
                onClick = { this._onClick } />
        );
    }
}
