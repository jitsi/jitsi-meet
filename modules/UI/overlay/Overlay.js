/* global $, APP */

/**
 * Base class for overlay components - the components which are displayed on
 * top of the application with semi-transparent background covering the whole
 * screen.
 */
export default class Overlay{
    /**
     * Creates new <tt>Overlay</tt> instance.
     */
    constructor() {
        /**
         *
         * @type {jQuery}
         */
        this.$overlay = null;

        /**
         * Indicates if this overlay should use the light look & feel or the
         * standard one.
         * @type {boolean}
         */
        this.isLightOverlay = false;
    }
    /**
     * Template method which should be used by subclasses to provide the overlay
     * content. The contents provided by this method are later subject to
     * the translation using {@link APP.translation.translateElement}.
     * @return {string} HTML representation of the overlay dialog contents.
     * @protected
     */
    _buildOverlayContent() {
        return '';
    }
    /**
     * Constructs the HTML body of the overlay dialog.
     *
     * @private
     */
    _buildOverlayHtml() {

        let overlayContent = this._buildOverlayContent();

        let containerClass = this.isLightOverlay    ? "overlay__container-light"
                                                    : "overlay__container";

        this.$overlay = $(`
            <div class=${containerClass}>
                <div class='overlay__content'>
                    ${overlayContent}
                </div>
            </div>`);

        APP.translation.translateElement(this.$overlay);
    }
    /**
     * Checks whether the page reload overlay has been displayed.
     * @return {boolean} <tt>true</tt> if the page reload overlay is currently
     * visible or <tt>false</tt> otherwise.
     */
    isVisible() {
        return this.$overlay && this.$overlay.parents('body').length > 0;
    }
    /**
     * Template method called just after the overlay is displayed for the first
     * time.
     * @protected
     */
    _onShow() {
        // To be overridden by subclasses.
    }
    /**
     * Shows the overlay dialog and attaches the underlying HTML representation
     * to the DOM.
     */
    show() {

        !this.$overlay && this._buildOverlayHtml();

        if (!this.isVisible()) {
            this.$overlay.appendTo('body');
            this._onShow();
        }
    }

    /**
     * Hides the overlay dialog and detaches it's HTML representation from
     * the DOM.
     */
    hide() {
        this.$overlay && this.$overlay.detach();
    }
}
