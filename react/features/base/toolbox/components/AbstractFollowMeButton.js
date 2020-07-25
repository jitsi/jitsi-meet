// @flow

import { IconFollowEnabled, IconFollowDisabled } from '../../icons';

import AbstractButton from './AbstractButton';
import type { Props } from './AbstractButton';

/**
 * An abstract implementation of a button for toggling audio mute.
 */
export default class AbstractFollowMeButton<P: Props, S: *>
    extends AbstractButton<P, S> {

    icon = IconFollowEnabled;
    toggledIcon = IconFollowDisabled;

    /**
     * Handles clicking / pressing the button, and toggles the audio mute state
     * accordingly.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this._setFollowMe(!this._isFollowMeEnabled());
    }

    /**
     * Helper function to be implemented by subclasses, which must return a
     * boolean value indicating.
     *
     * @protected
     * @returns {boolean}
     */
    _isFollowMeEnabled() {
        // To be implemented by subclass.
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return !this._isFollowMeEnabled();
    }

    /**
     * Helper function to perform the actual setting of the audio mute / unmute
     * action.
     *
     * @param {boolean} followMeEnabled - followMeEnabled.
     * @protected
     * @returns {void}
     */
    _setFollowMe(followMeEnabled: boolean) { // eslint-disable-line no-unused-vars
        // To be implemented by subclass.
    }
}
