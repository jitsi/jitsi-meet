// @flow

import { Component } from 'react';

import { addAudio, removeAudio } from '../actions';

/**
 * Describes audio element interface used in the base/media feature for audio
 * playback.
 */
export type AudioElement = {
    play: ?Function,
    pause: ?Function
}

/**
 * {@code AbstractAudio} component's property types.
 */
type Props = {

    /**
     * Dispatches {@link ADD_AUDIO} Redux action which will store the
     * {@link AudioElement} from the Redux store.
     */
    _addAudio: Function,

    /**
     * Dispatches {@link REMOVE_AUDIO} Redux action which will remove the
     * {@link AudioElement} from the Redux store.
     */
    _removeAudio: Function,

    /**
     * If both {@code src} and {@code audioId} are specified a reference to the
     * audio element will be stored in the Redux store, as long as the component
     * remains in the React's DOM tree. {@code audioId} is a global audio
     * element identifier which will be used to identify it within Redux audio
     * related actions.
     */
    audioId: string,

    /**
     * A callback which will be called with {@code AbstractAudio} instance once
     * the audio element is loaded.
     */
    setRef: ?Function,

    /**
     * The URL of a media resource to use in the element.
     *
     * @type {string}
     */
    src: string,
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

    setAudioElementImpl: Function;

    /**
     * Initializes a new {@code AbstractAudio} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Object) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this.setAudioElementImpl = this.setAudioElementImpl.bind(this);
    }

    /**
     * Attempts to pause the playback of the media.
     *
     * @public
     * @returns {void}
     */
    pause() {
        this._audioElementImpl
            && typeof this._audioElementImpl.pause === 'function'
            && this._audioElementImpl.pause();
    }

    /**
     * Attempts to being the playback of the media.
     *
     * @public
     * @returns {void}
     */
    play() {
        this._audioElementImpl
            && typeof this._audioElementImpl.play === 'function'
            && this._audioElementImpl.play();
    }

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

        // AudioElements are stored only if both 'src' and 'audioId' properties
        // are present.
        if (element && this.props.src && this.props.audioId) {
            this.props._addAudio(this.props.audioId, element);
        } else if (!element && this.props.src && this.props.audioId) {
            this.props._removeAudio(this.props.audioId);
        }

        if (typeof this.props.setRef === 'function') {
            this.props.setRef(element ? this : null);
        }
    }
}

/**
 * Maps dispatching of some actions to React component props.
 *
 * @param {Function} dispatch - Redux action dispatcher.
 * @returns {{
 *     _addSound: void,
 *     _removeSound: void
 * }}
 * @private
 */
export function _mapDispatchToProps(dispatch: Function) {
    return {
        /**
         * Dispatches action to store the {@link AudioElement} under
         * {@code audioId} in the Redux store, so that the playback can be
         * controlled through the Redux actions.
         *
         * @param {string} audioId - A global identifier which will be used to
         * identify the audio element instance.
         * @param {AudioElement} audioRef - The {@link AudioElement} instance
         * that will be stored in the Redux state of the base/media feature.
         * @returns {void}
         * @private
         */
        _addAudio(audioId: string, audioRef: AudioElement) {
            dispatch(addAudio(audioId, audioRef));
        },

        /**
         * Dispatches action to remove {@link AudioElement} from the Redux
         * store.
         *
         * @param {string} audioId - The id of the {@link AudioElement} instance
         * to be removed from the Redux store.
         * @returns {void}
         * @private
         */
        _removeAudio(audioId: string) {
            dispatch(removeAudio(audioId));
        }
    };
}
