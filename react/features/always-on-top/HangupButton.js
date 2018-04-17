// @flow

// XXX: AlwaysOnTop imports the button directly in order to avoid bringing in
// other components that use lib-jitsi-meet, which always on top does not
// import.
import AbstractHangupButton
    from '../toolbox/components/buttons/AbstractHangupButton';
import type { Props } from '../toolbox/components/buttons/AbstractButton';

const { api } = window.alwaysOnTop;

/**
 * Stateless hangup button for the Always-on-Top windows.
 */
export default class HangupButton extends AbstractHangupButton<Props, *> {
    /**
     * Helper function to perform the actual hangup action.
     *
     * @override
     * @private
     * @returns {void}
     */
    _doHangup() {
        api.executeCommand('hangup');
        window.close();
    }

    /**
     * Indicates whether this button is disabled or not.
     *
     * @override
     * @private
     * @returns {boolean}
     */
    _isDisabled() {
        return false;
    }
}
