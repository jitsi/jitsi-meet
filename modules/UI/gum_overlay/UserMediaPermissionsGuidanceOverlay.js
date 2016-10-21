/* global */

import Overlay from '../overlay/Overlay';

/**
 * An overlay with guidance how to proceed with gUM prompt.
 */
class GUMOverlayImpl extends Overlay {

    /**
     * Constructs overlay with guidance how to proceed with gUM prompt.
     * @param {string} browser - name of browser for which to construct the
     *     guidance overlay.
     * @override
     */
    constructor(browser) {
        super();
        this.browser = browser;
    }

    /**
     * @inheritDoc
     */
    _buildOverlayContent() {
        return `
            <span class="overlay_icon icon-microphone"></span>
            <span class="overlay_icon icon-camera"></span>
            <span data-i18n='[html]userMedia.${this.browser}GrantPermissions' 
                  class='overlay_text_small'></span>`;
    }
}

/**
 * Stores GUM overlay instance.
 * @type {GUMOverlayImpl}
 */
let overlay;

export default {
    /**
     * Checks whether the overlay is currently visible.
     * @return {boolean} <tt>true</tt> if the overlay is visible
     * or <tt>false</tt> otherwise.
     */
    isVisible () {
        return overlay && overlay.isVisible();
    },
    /**
     * Shows browser-specific overlay with guidance how to proceed with
     * gUM prompt.
     * @param {string} browser - name of browser for which to show the
     *      guidance overlay.
     */
    show(browser) {
        if (!overlay) {
            overlay = new GUMOverlayImpl(browser);
        }
        overlay.show();
    },

    /**
     * Hides browser-specific overlay with guidance how to proceed with
     * gUM prompt.
     */
    hide() {
        overlay && overlay.hide();
    }
};
