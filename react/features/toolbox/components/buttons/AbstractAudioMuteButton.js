// @flow

import AbstractButton from './AbstractButton';
import type { Props } from './AbstractButton';

/**
 * An abstract implementation of a button for toggling audio mute.
 */
class AbstractAudioMuteButton<P: Props, S: *> extends AbstractButton<P, S> {
    accessibilityLabel = 'Audio mute';
    iconName = 'icon-microphone';
    toggledIconName = 'icon-mic-disabled toggled';

    /**
     * Handles clicking / pressing the button, and toggles the audio mute state
     * accordingly.
     *
     * @override
     * @private
     * @returns {void}
     */
    _handleClick() {
        this._setAudioMuted(!this._isAudioMuted());
    }

    /**
     * Helper function to be implemented by subclasses, which must return a
     * boolean value indicating if audio is muted or not.
     *
     * @abstract
     * @private
     * @returns {boolean}
     */
    _isAudioMuted() {
        // To be implemented by subclass.
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @private
     * @returns {boolean}
     */
    _isToggled() {
        return this._isAudioMuted();
    }

    /**
     * Helper function to perform the actual setting of the audio mute / unmute
     * action.
     *
     * @param {boolean} audioMuted - Whether video should be muted or not.
     * @private
     * @returns {void}
     */
    _setAudioMuted(audioMuted: boolean) { // eslint-disable-line no-unused-vars
        // To be implemented by subclass.
    }
}

export default AbstractAudioMuteButton;
