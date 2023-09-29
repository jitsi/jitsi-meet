import { IconHangup } from '../../icons/svg';

import AbstractButton, { IProps } from './AbstractButton';

/**
 * An abstract implementation of a button for disconnecting a conference.
 */
export default class AbstractHangupButton<P extends IProps, S=any>
    extends AbstractButton<P, S> {

    icon = IconHangup;

    /**
     * Handles clicking / pressing the button, and disconnects the conference.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this._doHangup();
    }

    /**
     * Helper function to perform the actual hangup action.
     *
     * @protected
     * @returns {void}
     */
    _doHangup() {
        // To be implemented by subclass.
    }
}
