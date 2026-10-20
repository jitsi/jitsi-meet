import { Component } from 'react';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
import { registerSoundUrl, unregisterSoundUrl } from '../SoundManager';
import { _addAudioElement, _removeAudioElement } from '../actions';
import { Sound } from '../reducer';

/**
 * {@link SoundCollection}'s properties.
 */
interface IProps {

    /**
     * Dispatches {@link _ADD_AUDIO_ELEMENT} Redux action (legacy - kept for reducer compatibility).
     */
    _addAudioElement: Function;

    /**
     * Dispatches {@link _REMOVE_AUDIO_ELEMENT} Redux action (legacy - kept for reducer compatibility).
     */
    _removeAudioElement: Function;

    /**
     * It's the 'base/sounds' reducer's state mapped to a property.
     * Used to register sounds with the SoundManager.
     */
    _sounds: Map<string, Sound>;
}

/**
 * Collections of all global sounds used by the app for playing audio
 * notifications in response to various events.
 *
 * This component no longer renders <audio> elements directly. Instead, it
 * registers sounds with the SoundManager which uses WebAudio with an
 * HTMLAudio fallback pool (3 elements).
 */
class SoundCollection extends Component<IProps> {
    /**
     * Set of sound IDs currently registered.
     */
    _registeredSounds = new Set<string>();

    /**
     * Implements React's {@link Component#componentDidMount()}.
     *
     * @inheritdoc
     * @returns {void}
     */
    override componentDidMount() {
        this._registerAllSounds();
    }

    /**
     * Implements React's {@link Component#componentDidUpdate()}.
     *
     * @inheritdoc
     * @returns {void}
     */
    override componentDidUpdate(prevProps: IProps) {
        if (this.props._sounds !== prevProps._sounds) {
            this._registerAllSounds();
        }
    }

    /**
     * Implements React's {@link Component#componentWillUnmount()}.
     *
     * @inheritdoc
     * @returns {void}
     */
    override componentWillUnmount() {
        // Unregister all sounds from the manager
        for (const soundId of this._registeredSounds) {
            unregisterSoundUrl(soundId);
        }
        this._registeredSounds.clear();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        // No longer renders audio elements - SoundManager handles playback
        return null;
    }

    /**
     * Registers all sounds from the Redux store with the SoundManager.
     *
     * @private
     * @returns {void}
     */
    _registerAllSounds() {
        const currentSoundIds = new Set<string>();

        for (const [ soundId, sound ] of this.props._sounds.entries()) {
            const { src } = sound;

            if (src && typeof src === 'string') {
                currentSoundIds.add(soundId);

                if (!this._registeredSounds.has(soundId)) {
                    // Register new sound with SoundManager
                    registerSoundUrl(soundId, src);
                    this._registeredSounds.add(soundId);

                    // Dispatch legacy action for reducer compatibility
                    // This maintains the Redux state structure
                    this.props._addAudioElement(soundId, {
                        play: () => { /* Handled by middleware */ },
                        pause: () => { /* Handled by middleware */ },
                        stop: () => { /* Handled by middleware */ },
                        currentTime: 0
                    });
                }
            }
        }

        // Unregister sounds that are no longer in the state
        for (const soundId of this._registeredSounds) {
            if (!currentSoundIds.has(soundId)) {
                unregisterSoundUrl(soundId);
                this._registeredSounds.delete(soundId);
                this.props._removeAudioElement(soundId);
            }
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
function _mapStateToProps(state: IReduxState) {
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
export function _mapDispatchToProps(dispatch: IStore['dispatch']) {
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
