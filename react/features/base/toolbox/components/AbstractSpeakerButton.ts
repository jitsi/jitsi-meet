// @flow

import { IconVolumeUp, IconVolumeOff } from '../../icons/svg';

import AbstractButton, { IProps } from './AbstractButton';

/**
 * An abstract implementation of a button for toggling video mute.
 */
export default class AbstractSpeakerButton<P extends IProps, S=any>
    extends AbstractButton<P, S> {

    icon = IconVolumeUp;
    toggledIcon = IconVolumeOff;

    /**
     * Handles clicking / pressing the button, and toggles the video mute state
     * accordingly.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this._setSpeakerMuted(!this._isSpeakerMuted());
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this._isSpeakerMuted();
    }

    /**
     * Helper function to be implemented by subclasses, which must return a
     * {@code boolean} value indicating if video is muted or not.
     *
     * @protected
     * @returns {boolean}
     */
    _isSpeakerMuted() {
        // To be implemented by subclass.
        return true;
    }

    /**
     * Helper function to perform the actual setting of the video mute / unmute
     * action.
     *
     * @param {boolean} videoMuted - Whether video should be muted or not.
     * @protected
     * @returns {void}
     */
    _setSpeakerMuted(_speakerMuted: boolean) { // eslint-disable-line no-unused-vars
        // To be implemented by subclass.
    }
}