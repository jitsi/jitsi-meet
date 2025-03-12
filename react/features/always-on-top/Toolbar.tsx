import React, { Component } from 'react';

import AudioMuteButton from './AudioMuteButton';
import HangupButton from './HangupButton';
import VideoMuteButton from './VideoMuteButton';

const { api } = window.alwaysOnTop;

/**
 * The type of the React {@code Component} props of {@link Toolbar}.
 */
interface IProps {

    /**
     * Additional CSS class names to add to the root of the toolbar.
     */
    className: string;

    /**
     * Callback invoked when no longer moused over the toolbar.
     */
    onMouseOut: (e?: React.MouseEvent) => void;

    /**
     * Callback invoked when the mouse has moved over the toolbar.
     */
    onMouseOver: (e?: React.MouseEvent) => void;
}

/**
 * The type of the React {@code Component} state of {@link Toolbar}.
 */
interface IState {

    /**
     * Whether audio button to be shown or not.
     */
    showAudioButton: boolean;

    /**
     * Whether video button to be shown or not.
     */
    showVideoButton: boolean;
}

type Props = Partial<IProps>;

/**
 * Represents the toolbar in the Always On Top window.
 *
 * @augments Component
 */
export default class Toolbar extends Component<Props, IState> {
    /**
     * Initializes a new {@code Toolbar} instance.
     *
     * @param {IProps} props - The React {@code Component} props to initialize the new {@code Toolbar} instance with.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            showAudioButton: true,
            showVideoButton: true
        };

        this._videoConferenceJoinedListener = this._videoConferenceJoinedListener.bind(this);
    }

    /**
     * Sets listens for changing meetings while showing the toolbar.
     *
     * @inheritdoc
     * @returns {void}
     */
    override componentDidMount() {
        api.on('videoConferenceJoined', this._videoConferenceJoinedListener);

        this._videoConferenceJoinedListener();
    }

    /**
     * Handles is visitor changes.
     *
     * @returns {void}
     */
    _videoConferenceJoinedListener() {
        // for electron clients that embed the api and are not updated
        if (!api.isVisitor) {
            console.warn('external API not updated');

            return;
        }

        const isNotVisitor = !api.isVisitor();

        this.setState({
            showAudioButton: isNotVisitor,
            showVideoButton: isNotVisitor
        });
    }

    /**
     * Removes all listeners.
     *
     * @inheritdoc
     * @returns {void}
     */
    override componentWillUnmount() {
        api.removeListener('videoConferenceJoined', this._videoConferenceJoinedListener);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
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
                { this.state.showAudioButton && <AudioMuteButton /> }
                { this.state.showVideoButton && <VideoMuteButton /> }
                <HangupButton customClass = 'hangup-button' />
            </div>
        );
    }
}
