// @flow

import AbstractButton from './AbstractButton';
import type { Props } from './AbstractButton';

/**
 * An abstract implementation of a button for disconnecting a conference.
 */
class AbstractHangupButton<P : Props, S: *> extends AbstractButton<P, S> {
    accessibilityLabel = 'Hangup';
    iconName = 'icon-hangup';

    /**
     * Handles clicking / pressing the button, and disconnects the conference.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        this._doHangup();
    }

    /**
     * Helper function to perform the actual hangup action.
     *
     * @abstract
     * @private
     * @returns {void}
     */
    _doHangup() {
        // To be implemented by subclass.
    }
}

export default AbstractHangupButton;
