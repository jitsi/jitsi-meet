// @flow

import AbstractButton from './AbstractButton';
import type { Props } from './AbstractButton';

/**
 * An abstract implementation of a button for toggling video mute.
 */
export default class AbstractVideoMuteButton<P : Props, S : *>
    extends AbstractButton<P, S> {

    accessibilityLabel = 'Video mute';
    iconName = 'icon-camera';
    toggledIconName = 'icon-camera-disabled toggled';

    /**
     * Handles clicking / pressing the button, and toggles the video mute state
     * accordingly.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        this._setVideoMuted(!this._isVideoMuted());
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @private
     * @returns {boolean}
     */
    _isToggled() {
        return this._isVideoMuted();
    }

    /**
     * Helper function to be implemented by subclasses, which must return a
     * boolean value indicating if video is muted or not.
     *
     * @abstract
     * @private
     * @returns {boolean}
     */
    _isVideoMuted() {
        // To be implemented by subclass.
    }

    /**
     * Helper function to perform the actual setting of the video mute / unmute
     * action.
     *
     * @param {boolean} videoMuted - Whether video should be muted or not.
     * @private
     * @returns {void}
     */
    _setVideoMuted(videoMuted: boolean) { // eslint-disable-line no-unused-vars
        // To be implemented by subclass.
    }
}
