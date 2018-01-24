// @flow

import { Component } from 'react';

/**
 * Describes audio element interface used in the base/media feature for audio
 * playback.
 */
export type AudioElement = {
    pause: Function,
    play: Function,
    setSinkId: ?Function
}

/**
 * {@code AbstractAudio} component's property types.
 */
type Props = {

    /**
     * A callback which will be called with {@code AbstractAudio} instance once
     * the audio element is loaded.
     */
    setRef: ?Function,

    /**
     * The URL of a media resource to use in the element.
     *
     * NOTE on react-native sound files are imported through 'require' and then
     * passed as the 'src' parameter which means their type will be 'any'.
     *
     * @type {Object | string}
     */
    src: Object | string,
    stream: Object
}

/**
 * The React {@link Component} which is similar to Web's
 * {@code HTMLAudioElement}.
 */
export default class AbstractAudio extends Component<Props> {
    /**
     * The {@link AudioElement} instance which implements the audio playback
     * functionality.
     */
    _audioElementImpl: ?AudioElement;

    /**
     * Initializes a new {@code AbstractAudio} instance.
     *
     * @param {Props} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this.setAudioElementImpl = this.setAudioElementImpl.bind(this);
    }

    /**
     * Attempts to pause the playback of the media.
     *
     * @public
     * @returns {void}
     */
    pause() {
        this._audioElementImpl && this._audioElementImpl.pause();
    }

    /**
     * Attempts to being the playback of the media.
     *
     * @public
     * @returns {void}
     */
    play() {
        this._audioElementImpl && this._audioElementImpl.play();
    }

    setAudioElementImpl: (?AudioElement) => void;

    /**
     * Set the (reference to the) {@link AudioElement} object which implements
     * the audio playback functionality.
     *
     * @param {AudioElement} element - The {@link AudioElement} instance
     * which implements the audio playback functionality.
     * @protected
     * @returns {void}
     */
    setAudioElementImpl(element: ?AudioElement) {
        this._audioElementImpl = element;

        // setRef
        const { setRef } = this.props;

        typeof setRef === 'function' && setRef(element ? this : null);
    }

    /**
     * Sets the sink ID (output device ID) on the underlying audio element.
     * NOTE: Currently, implemented only on Web.
     *
     * @param {string} sinkId - The sink ID (output device ID).
     * @returns {void}
     */
    setSinkId(sinkId: String) {
        this._audioElementImpl
            && typeof this._audioElementImpl.setSinkId === 'function'
            && this._audioElementImpl.setSinkId(sinkId);
    }
}
