// @flow

import React, { Component } from 'react';

import AudioMuteButton from './AudioMuteButton';
import HangupButton from './HangupButton';
import VideoMuteButton from './VideoMuteButton';

/**
 * The type of the React {@code Component} props of {@link Toolbar}.
 */
type Props = {

    /**
     * Additional CSS class names to add to the root of the toolbar.
     */
    className: string,

    /**
     * Callback invoked when no longer moused over the toolbar.
     */
    onMouseOut: Function,

    /**
     * Callback invoked when the mouse has moved over the toolbar.
     */
    onMouseOver: Function
};

/**
 * Represents the toolbar in the Always On Top window.
 *
 * @extends Component
 */
export default class Toolbar extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            className = '',
            onMouseOut,
            onMouseOver
        } = this.props;

        return (
            <div
                className = { `toolbox-content-items always-on-top-toolbox ${className}` }
                onMouseOut = { onMouseOut }
                onMouseOver = { onMouseOver }>
                <AudioMuteButton />
                <HangupButton customClass = 'hangup-button' />
                <VideoMuteButton />
            </div>
        );
    }
}
