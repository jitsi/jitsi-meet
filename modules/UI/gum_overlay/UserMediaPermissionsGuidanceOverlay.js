/* global interfaceConfig */

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
    // `<span data-i18n='[html]userMedia.${this.browser}GrantPermissions'
    // class='inlay__text'></span>`
        let title = 'HipChat Video needs to use your microphone and camera.';
        let text;
        text = 'Select "Allow" when your browser asks for these permissions.';
        let content = (
            `<div class="inlay">
                <span class="inlay__icon icon-microphone"></span>
                <span class="inlay__icon icon-camera"></span>
                <h3 class="inlay__title">${title}</h3>
                <span class='inlay__text'>${text}</span>
            </div>`
        );

        if (interfaceConfig.HAS_POLICY) {
            content += (
                `<div class="policy overlay__policy">
                    <p class="policy__text" data-i18n="policyText"></p>
                    <div class="policy__logo">
                        <img src=""/>
                    </div>
                </div>`
            );
        }

        return content;
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
