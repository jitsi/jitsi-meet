// @flow

import { IconPresenter, IconPresenterDisabled } from '../../icons';

import AbstractButton from './AbstractButton';
import type { Props } from './AbstractButton';

/**
 * An abstract implementation of a button for toggling video mute.
 */
export default class AbstractPresenterMuteButton<P : Props, S : *>
    extends AbstractButton<P, S> {

    icon = IconPresenter;
    toggledIcon = IconPresenterDisabled;

    /**
     * Handles clicking / pressing the button, and toggles the presenter mute state
     * accordingly.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this._setPresenterMuted(!this._isPresenterMuted());
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this._isPresenterMuted();
    }

    /**
     * Helper function to be implemented by subclasses, which must return a
     * {@code boolean} value indicating if video is muted or not.
     *
     * @protected
     * @returns {boolean}
     */
    _isPresenterMuted() {
        // To be implemented by subclass.
    }

    /**
     * Helper function to perform the actual setting of the video mute / unmute
     * action.
     *
     * @param {boolean} PresenterMuted - Whether video should be muted or not.
     * @protected
     * @returns {void}
     */
    _setPresenterMuted(PresenterMuted: boolean) { // eslint-disable-line no-unused-vars
        // To be implemented by subclass.
    }
}
