import { IconVideo, IconVideoOff } from '../../icons/svg';

import AbstractButton, { IProps } from './AbstractButton';

/**
 * An abstract implementation of a button for toggling video mute.
 */
export default class BaseVideoMuteButton<P extends IProps, S=any>
    extends AbstractButton<P, S> {

    icon = IconVideo;
    toggledIcon = IconVideoOff;

    /**
     * Handles clicking / pressing the button, and toggles the video mute state
     * accordingly.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this._setVideoMuted(!this._isVideoMuted());
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this._isVideoMuted();
    }

    /**
     * Helper function to be implemented by subclasses, which must return a
     * {@code boolean} value indicating if video is muted or not.
     *
     * @protected
     * @returns {boolean}
     */
    _isVideoMuted() {
        // To be implemented by subclass.
        return false;
    }

    /**
     * Helper function to perform the actual setting of the video mute / unmute
     * action.
     *
     * @param {boolean} _videoMuted - Whether video should be muted or not.
     * @protected
     * @returns {void}
     */
    _setVideoMuted(_videoMuted: boolean) {
        // To be implemented by subclass.
    }
}
