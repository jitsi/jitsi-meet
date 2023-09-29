import React from 'react';

import AbstractAudio, { IProps } from '../AbstractAudio';

/**
 * The React/Web {@link Component} which is similar to and wraps around
 * {@code HTMLAudioElement} in order to facilitate cross-platform source code.
 */
export default class Audio extends AbstractAudio {
    /**
     * Set to <code>true</code> when the whole file is loaded.
     */
    _audioFileLoaded: boolean;

    /**
     * Reference to the HTML audio element, stored until the file is ready.
     */
    _ref?: HTMLAudioElement | null;

    /**
     * Creates new <code>Audio</code> element instance with given props.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onCanPlayThrough = this._onCanPlayThrough.bind(this);
        this._setRef = this._setRef?.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <audio
                loop = { Boolean(this.props.loop) }
                onCanPlayThrough = { this._onCanPlayThrough }
                preload = 'auto'
                ref = { this._setRef }
                src = { this.props.src } />
        );
    }

    /**
     * Stops the audio HTML element.
     *
     * @returns {void}
     */
    stop() {
        if (this._ref) {
            this._ref.pause();
            this._ref.currentTime = 0;
        }
    }

    /**
     * If audio element reference has been set and the file has been
     * loaded then {@link setAudioElementImpl} will be called to eventually add
     * the audio to the Redux store.
     *
     * @private
     * @returns {void}
     */
    _maybeSetAudioElementImpl() {
        if (this._ref && this._audioFileLoaded) {
            this.setAudioElementImpl(this._ref);
        }
    }

    /**
     * Called when 'canplaythrough' event is triggered on the audio element,
     * which means that the whole file has been loaded.
     *
     * @private
     * @returns {void}
     */
    _onCanPlayThrough() {
        this._audioFileLoaded = true;
        this._maybeSetAudioElementImpl();
    }

    /**
     * Sets the reference to the HTML audio element.
     *
     * @param {HTMLAudioElement} audioElement - The HTML audio element instance.
     * @private
     * @returns {void}
     */
    _setRef(audioElement?: HTMLAudioElement | null) {
        this._ref = audioElement;

        if (audioElement) {
            this._maybeSetAudioElementImpl();
        } else {
            // AbstractAudioElement is supposed to trigger "removeAudio" only if
            // it was previously added, so it's safe to just call it.
            this.setAudioElementImpl(null);

            // Reset the loaded flag, as the audio element is being removed from
            // the DOM tree.
            this._audioFileLoaded = false;
        }
    }
}
