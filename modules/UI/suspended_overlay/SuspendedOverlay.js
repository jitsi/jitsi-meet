/* global $, APP */

import Overlay from '../overlay/Overlay';

/**
 * An overlay dialog which is shown when a suspended event is detected.
 */
class SuspendedOverlayImpl extends Overlay{
    /**
     * Creates new <tt>SuspendedOverlayImpl</tt>
     */
    constructor() {
        super();

        $(document).on('click', '#rejoin', () => {
            APP.ConferenceUrl.reload();
        });
    }
    /**
     * Constructs overlay body with the message and a button to rejoin.
     * @override
     */
    _buildOverlayContent() {
        return (
        `<div class="inlay">
            <span class="inlay__icon icon-microphone"></span>
            <span class="inlay__icon icon-camera"></span>
            <h3 class="inlay__title" data-i18n="suspendedoverlay.title"></h3>
            <button id="rejoin" 
                 data-i18n="suspendedoverlay.rejoinKeyTitle" 
                 class="inlay__button button-control button-control_primary">
            </button>
        </div>`);
    }
}

/**
 * Holds the page suspended overlay instance.
 *
 * {@type SuspendedOverlayImpl}
 */
let overlay;

export default {
    /**
     * Checks whether the page suspended overlay has been displayed.
     * @return {boolean} <tt>true</tt> if the page suspended overlay is
     * currently visible or <tt>false</tt> otherwise.
     */
    isVisible() {
        return overlay && overlay.isVisible();
    },
    /**
     * Shows the page suspended overlay.
     */
    show() {

        if (!overlay) {
            overlay = new SuspendedOverlayImpl();
        }
        overlay.show();
    }
};
