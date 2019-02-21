/* global $, interfaceConfig */

/**
 * Associates the default display type with corresponding CSS class
 */
const SHOW_CLASSES = {
    'block': 'show',
    'inline': 'show-inline',
    'list-item': 'show-list-item'
};

/**
 * Contains sizes of thumbnails
 * @type {{SMALL: number, MEDIUM: number}}
 */
const ThumbnailSizes = {
    SMALL: 60,
    MEDIUM: 80
};

/**
 * Created by hristo on 12/22/14.
 */
const UIUtil = {

    /**
     * Returns the available video width.
     */
    getAvailableVideoWidth() {
        return window.innerWidth;
    },

    /**
     * Changes the style class of the element given by id.
     */
    buttonClick(id, classname) {
        // add the class to the clicked element
        $(`#${id}`).toggleClass(classname);
    },

    /**
     * Returns the text width for the given element.
     *
     * @param el the element
     */
    getTextWidth(el) {
        return el.clientWidth + 1;
    },

    /**
     * Returns the text height for the given element.
     *
     * @param el the element
     */
    getTextHeight(el) {
        return el.clientHeight + 1;
    },

    /**
     * Escapes the given text.
     */
    escapeHtml(unsafeText) {
        return $('<div/>').text(unsafeText)
            .html();
    },

    imageToGrayScale(canvas) {
        const context = canvas.getContext('2d');
        const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imgData.data;

        for (let i = 0, n = pixels.length; i < n; i += 4) {
            const grayscale
                = (pixels[i] * 0.3)
                    + (pixels[i + 1] * 0.59)
                    + (pixels[i + 2] * 0.11);

            pixels[i] = grayscale; // red
            pixels[i + 1] = grayscale; // green
            pixels[i + 2] = grayscale; // blue
            // pixels[i+3]              is alpha
        }

        // redraw the image in black & white
        context.putImageData(imgData, 0, 0);
    },

    /**
     * Inserts given child element as the first one into the container.
     * @param container the container to which new child element will be added
     * @param newChild the new element that will be inserted into the container
     */
    prependChild(container, newChild) {
        const firstChild = container.childNodes[0];

        if (firstChild) {
            container.insertBefore(newChild, firstChild);
        } else {
            container.appendChild(newChild);
        }
    },

    /**
     * Indicates if Authentication Section should be shown
     *
     * @returns {boolean}
     */
    isAuthenticationEnabled() {
        return interfaceConfig.AUTHENTICATION_ENABLE;
    },

    /**
     * Shows / hides the element given by id.
     *
     * @param {string|HTMLElement} idOrElement the identifier or the element
     *        to show/hide
     * @param {boolean} show <tt>true</tt> to show or <tt>false</tt> to hide
     */
    setVisible(id, visible) {
        let element;

        if (id instanceof HTMLElement) {
            element = id;
        } else {
            element = document.getElementById(id);
        }

        if (!element) {
            return;
        }

        if (!visible) {
            element.classList.add('hide');
        } else if (element.classList.contains('hide')) {
            element.classList.remove('hide');
        }

        const type = this._getElementDefaultDisplay(element.tagName);
        const className = SHOW_CLASSES[type];

        if (visible) {
            element.classList.add(className);
        } else if (element.classList.contains(className)) {
            element.classList.remove(className);
        }
    },

    /**
     * Returns default display style for the tag
     * @param tag
     * @returns {*}
     * @private
     */
    _getElementDefaultDisplay(tag) {
        const tempElement = document.createElement(tag);

        document.body.appendChild(tempElement);
        const style = window.getComputedStyle(tempElement).display;

        document.body.removeChild(tempElement);

        return style;
    },

    /**
     * Shows / hides the element with the given jQuery selector.
     *
     * @param {jQuery} jquerySelector the jQuery selector of the element to
     * show / shide
     * @param {boolean} isVisible
     */
    setVisibleBySelector(jquerySelector, isVisible) {
        if (jquerySelector && jquerySelector.length > 0) {
            jquerySelector.css('visibility', isVisible ? 'visible' : 'hidden');
        }
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
      * Create html attributes string out of object properties.
      * @param {Object} attrs object with properties
      * @returns {String} string of html element attributes
      */
    attrsToString(attrs) {
        return (
            Object.keys(attrs).map(key => ` ${key}="${attrs[key]}"`)
.join(' '));
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
    },

    /**
     * Shows / hides the element given by {selector} and sets a timeout if the
     * {hideDelay} is set to a value > 0.
     * @param selector the jquery selector of the element to show/hide.
     * @param show a {boolean} that indicates if the element should be shown or
     * hidden
     * @param hideDelay the value in milliseconds to wait before hiding the
     * element
     */
    animateShowElement(selector, show, hideDelay) {
        if (show) {
            if (!selector.is(':visible')) {
                selector.css('display', 'inline-block');
            }

            selector.fadeIn(300,
                () => {
                    selector.css({ opacity: 1 });
                }
            );

            if (hideDelay && hideDelay > 0) {
                setTimeout(
                    () => {
                        selector.fadeOut(
                            300,
                            () => {
                                selector.css({ opacity: 0 });
                            });
                    },
                    hideDelay);
            }
        } else {
            selector.fadeOut(300,
                () => {
                    selector.css({ opacity: 0 });
                }
            );
        }
    },

    /**
     * Parses the given cssValue as an Integer. If the value is not a number
     * we return 0 instead of NaN.
     * @param cssValue the string value we obtain when querying css properties
     */
    parseCssInt(cssValue) {
        return parseInt(cssValue, 10) || 0;
    },

    /**
     * Adds href value to 'a' link jquery object. If link value is null,
     * undefined or empty string, disables the link.
     * @param {object} aLinkElement the jquery object
     * @param {string} link the link value
     */
    setLinkHref(aLinkElement, link) {
        if (link) {
            aLinkElement.attr('href', link);
        } else {
            aLinkElement.css({
                'pointer-events': 'none',
                'cursor': 'default'
            });
        }
    },

    /**
     * Returns font size for indicators according to current
     * height of thumbnail
     * @param {Number} [thumbnailHeight] - current height of thumbnail
     * @returns {Number} - font size for current height
     */
    getIndicatorFontSize(thumbnailHeight) {
        const height = typeof thumbnailHeight === 'undefined'
            ? $('#localVideoContainer').height() : thumbnailHeight;

        const { SMALL, MEDIUM } = ThumbnailSizes;
        const IndicatorFontSizes = interfaceConfig.INDICATOR_FONT_SIZES || {
            SMALL: 5,
            MEDIUM: 6,
            NORMAL: 8
        };
        let fontSize = IndicatorFontSizes.NORMAL;

        if (height <= SMALL) {
            fontSize = IndicatorFontSizes.SMALL;
        } else if (height > SMALL && height <= MEDIUM) {
            fontSize = IndicatorFontSizes.MEDIUM;
        }

        return fontSize;
    }
};

export default UIUtil;
