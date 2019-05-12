// @flow

import React, { Component } from 'react';

import { Audio } from '../../media';
import type { AudioElement } from '../../media';
import { connect } from '../../redux';

import { _addAudioElement, _removeAudioElement } from '../actions';
import type { Sound } from '../reducer';

/**
 * {@link SoundCollection}'s properties.
 */
type Props = {

    /**
     * Dispatches {@link _ADD_AUDIO_ELEMENT} Redux action which will store the
     * {@link AudioElement} for a sound in the Redux store.
     */
    _addAudioElement: Function,

    /**
     * Dispatches {@link _REMOVE_AUDIO_ELEMENT} Redux action which will remove
     * the sound's {@link AudioElement} from the Redux store.
     */
    _removeAudioElement: Function,

    /**
     * It's the 'base/sounds' reducer's state mapped to a property. It's used to
     * render audio elements for every registered sound.
     */
    _sounds: Map<string, Sound>
}

/**
 * Collections of all global sounds used by the app for playing audio
 * notifications in response to various events. It renders <code>Audio</code>
 * element for each sound registered in the base/sounds feature. When the audio
 * resource is loaded it will emit add/remove audio element actions which will
 * attach the element to the corresponding {@link Sound} instance in the Redux
 * state. When that happens the sound can be played using the {@link playSound}
 * action.
 */
class SoundCollection extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        let key = 0;
        const sounds = [];

        for (const [ soundId, sound ] of this.props._sounds.entries()) {
            const { options, src } = sound;

            sounds.push(
                React.createElement(
                    Audio, {
                        key,
                        setRef: this._setRef.bind(this, soundId),
                        src,
                        loop: options.loop
                    }));
            key += 1;
        }

        return sounds;
    }

    /**
     * Set the (reference to the) {@link AudioElement} object which implements
     * the audio playback functionality.
     *
     * @param {string} soundId - The sound Id for the audio element for which
     * the callback is being executed.
     * @param {AudioElement} element - The {@link AudioElement} instance
     * which implements the audio playback functionality.
     * @protected
     * @returns {void}
     */
    _setRef(soundId: string, element: ?AudioElement) {
        if (element) {
            this.props._addAudioElement(soundId, element);
        } else {
            this.props._removeAudioElement(soundId);
        }
    }
}

/**
 * Maps (parts of) the Redux state to {@code SoundCollection}'s props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {{
 *     _sounds: Map<string, Sound>
 * }}
 */
function _mapStateToProps(state) {
    return {
        _sounds: state['features/base/sounds']
    };
}

/**
 * Maps dispatching of some actions to React component props.
 *
 * @param {Function} dispatch - Redux action dispatcher.
 * @private
 * @returns {{
 *     _addAudioElement: void,
 *     _removeAudioElement: void
 * }}
 */
export function _mapDispatchToProps(dispatch: Function) {
    return {
        /**
         * Dispatches action to store the {@link AudioElement} for
         * a {@link Sound} identified by given <tt>soundId</tt> in the Redux
         * store, so that the playback can be controlled through the Redux
         * actions.
         *
         * @param {string} soundId - A global identifier which will be used to
         * identify the {@link Sound} instance for which an audio element will
         * be added.
         * @param {AudioElement} audioElement - The {@link AudioElement}
         * instance that will be stored in the Redux state of the base/sounds
         * feature, as part of the {@link Sound} object. At that point the sound
         * will be ready for playback.
         * @private
         * @returns {void}
         */
        _addAudioElement(soundId: string, audioElement: AudioElement) {
            dispatch(_addAudioElement(soundId, audioElement));
        },

        /**
         * Dispatches action to remove {@link AudioElement} from the Redux
         * store for specific {@link Sound}, because it is no longer part of
         * the DOM tree and the audio resource will be released.
         *
         * @param {string} soundId - The id of the {@link Sound} instance for
         * which an {@link AudioElement} will be removed from the Redux store.
         * @private
         * @returns {void}
         */
        _removeAudioElement(soundId: string) {
            dispatch(_removeAudioElement(soundId));
        }
    };
}

export default connect(_mapStateToProps, _mapDispatchToProps)(SoundCollection);
