/* global $ */

/**
 * Created by hristo on 12/22/14.
 */
const UIUtil = {

    /**
     * Escapes the given text.
     */
    escapeHtml(unsafeText) {
        return $('<div/>').text(unsafeText)
            .html();
    },

    /**
     * Inserts given child element as the first one into the container.
     * @param container the container to which new child element will be added
     * @param newChild the new element that will be inserted into the container
     */
    prependChild(container, newChild) {
        const firstChild = container.childNodes[0];
        let result;

        if (firstChild) {
            result = container.insertBefore(newChild, firstChild);
        } else {
            result = container.appendChild(newChild);
        }

        return result;
    },

    /**
     * Redirects to a given URL.
     *
     * @param {string} url - The redirect URL.
     * NOTE: Currently used to redirect to 3rd party location for
     * authentication. In most cases redirectWithStoredParams action must be
     * used instead of this method in order to preserve curent URL params.
     */
    redirect(url) {
        window.location.href = url;
    },

    /**
     * Indicates if we're currently in full screen mode.
     *
     * @return {boolean} {true} to indicate that we're currently in full screen
     * mode, {false} otherwise
     */
    isFullScreen() {
        return Boolean(document.fullscreenElement
            || document.mozFullScreenElement
            || document.webkitFullscreenElement
            || document.msFullscreenElement);
    },

    /**
     * Checks if the given DOM element is currently visible. The offsetParent
     * will be null if the "display" property of the element or any of its
     * parent containers is set to "none". This method will NOT check the
     * visibility property though.
     * @param {el} The DOM element we'd like to check for visibility
     */
    isVisible(el) {
        return el.offsetParent !== null;
    }
};

export default UIUtil;
