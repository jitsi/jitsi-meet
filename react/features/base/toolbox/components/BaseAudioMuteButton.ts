import { IconMic, IconMicSlash } from '../../icons/svg';

import AbstractButton, { IProps } from './AbstractButton';

/**
 * An abstract implementation of a button for toggling audio mute.
 */
export default class BaseAudioMuteButton<P extends IProps, S=any>
    extends AbstractButton<P, S> {

    override icon = IconMic;
    override toggledIcon = IconMicSlash;

    /**
     * Handles clicking / pressing the button, and toggles the audio mute state
     * accordingly.
     *
     * @override
     * @protected
     * @returns {void}
     */
    override _handleClick() {
        this._setAudioMuted(!this._isAudioMuted());
    }

    /**
     * Helper function to be implemented by subclasses, which must return a
     * boolean value indicating if audio is muted or not.
     *
     * @protected
     * @returns {boolean}
     */
    _isAudioMuted() {
        // To be implemented by subclass.
        return false;
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    override _isToggled() {
        return this._isAudioMuted();
    }

    /**
     * Helper function to perform the actual setting of the audio mute / unmute
     * action.
     *
     * @param {boolean} _audioMuted - Whether audio should be muted or not.
     * @protected
     * @returns {void}
     */
    _setAudioMuted(_audioMuted: boolean) {
        // To be implemented by subclass.
    }
}
