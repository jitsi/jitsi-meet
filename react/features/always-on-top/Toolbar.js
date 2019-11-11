// @flow

import React, { Component } from 'react';

import AudioMuteButton from './AudioMuteButton';
import HangupButton from './HangupButton';
import PresenterMuteButton from './PresenterMuteButton';
import VideoMuteButton from './VideoMuteButton';

const { api } = window.alwaysOnTop;

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
 * The type of the React {@code Component} state of {@link Toolbar}.
 */
type State = {

    /**
     * Whether or not the local participant is screensharing.
     */
    screenSharing: boolean
};

/**
 * Represents the toolbar in the Always On Top window.
 *
 * @extends Component
 */
export default class Toolbar extends Component<Props, State> {

    /**
     * Initializes a new {@code Toolbar} instance.
     *
     * @param {Props} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            screenSharing: false
        };

        // Bind event handlers so they are only bound once per instance.
        this._screensharingToggledListener
            = this._screensharingToggledListener.bind(this);
    }

    /**
     * Sets screensharing status changed listener.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        api.on('screenSharingStatusChanged',
            this._screensharingToggledListener);
    }

    /**
     * Removes all listeners.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        api.removeListener(
            'screenSharingStatusChanged',
            this._screensharingToggledListener);
    }

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
        const { screenSharing } = this.state;

        return (
            <div
                className = { `always-on-top-toolbox ${className}` }
                onMouseOut = { onMouseOut }
                onMouseOver = { onMouseOver }>
                <AudioMuteButton />
                <HangupButton />
                <PresenterMuteButton
                    visible = { screenSharing } />
                <VideoMuteButton
                    visible = { !screenSharing } />
            </div>
        );
    }

    _screensharingToggledListener: ({ on: boolean }) => void;

    /**
     * Handles screensharing toggled api events.
     *
     * @param {{ on: boolean }} status - The new sharing status.
     * @returns {void}
     */
    _screensharingToggledListener({ on }) {
        this.setState({ screenSharing: on });
    }
}
