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
        let textKey = `userMedia.${this.browser}GrantPermissions`;
        let titleKey = 'startupoverlay.title';
        let titleOptions = '{ "postProcess": "resolveAppName" }';
        let policyTextKey = 'startupoverlay.policyText';
        let policyLogo = '';
        let policyLogoSrc = interfaceConfig.POLICY_LOGO;
        if (policyLogoSrc) {
            policyLogo += (
                `<div class="policy__logo">
                    <img src="${policyLogoSrc}"/>
                </div>`
            );
        }

        return (
            `<div class="inlay">
                <span class="inlay__icon icon-microphone"></span>
                <span class="inlay__icon icon-camera"></span>
                <h3 class="inlay__title" data-i18n="${titleKey}"
                    data-i18n-options='${titleOptions}'></h3>
                <span class='inlay__text'data-i18n='[html]${textKey}'></span>
            </div>
            <div class="policy overlay__policy">
                <p class="policy__text" data-i18n="[html]${policyTextKey}"></p>
                ${policyLogo}
            </div>`
        );
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
