/* global $, APP, AJS, interfaceConfig */

// eslint-disable-next-line max-len
import KeyboardShortcut from '../../../../modules/keyboardshortcut/keyboardshortcut';

/**
 * Associates tooltip element position (in the terms of
 * {@link UIUtil#setTooltip} which do not look like CSS <tt>position</tt>) with
 * AUI tooltip <tt>gravity</tt>.
 */
const TOOLTIP_POSITIONS = {
    'bottom': 'n',
    'bottom-left': 'ne',
    'bottom-right': 'nw',
    'left': 'e',
    'right': 'w',
    'top': 's',
    'top-left': 'se',
    'top-right': 'sw'
};

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
 * Contains font sizes for thumbnail indicators
 * @type {{SMALL: number, MEDIUM: number}}
 */
const IndicatorFontSizes = {
    SMALL: 5,
    MEDIUM: 6,
    NORMAL: 8
};

/**
 * Created by hristo on 12/22/14.
 */
const UIUtil = {

    /**
     * Returns the available video width.
     *
     * @returns {nubmer}
     */
    getAvailableVideoWidth() {
        return window.innerWidth;
    },

    /**
     * Changes the style class of the element given by id.
     *
     * @param {string} id - Button identificator.
     * @param {string} classname - Class name.
     * @returns {void}
     */
    buttonClick(id, classname) {
        // add the class to the clicked element
        $(`#${id}`).toggleClass(classname);
    },

    /**
     * Returns the text width for the given element.
     *
     * @param {HTMLElement} el - The element.
     * @returns {number}
     */
    getTextWidth(el) {
        return el.clientWidth + 1;
    },

    /**
     * Returns the text height for the given element.
     *
     * @param {HTMLElement} el - The element.
     * @returns {number}
     */
    getTextHeight(el) {
        return el.clientHeight + 1;
    },

    /**
     * Plays the sound given by id.
     *
     * @param {string} id - The identifier of the audio element.
     * @returns {void}
     */
    playSoundNotification(id) {
        document.getElementById(id).play();
    },

    /**
     * Escapes the given text.
     *
     * @param {string} unsafeText - Unescaped text.
     * @returns {string} Escaped html string.
     */
    escapeHtml(unsafeText) {
        return $('<div/>').text(unsafeText)
            .html();
    },

    /**
     * Unescapes the given text.
     *
     * @param {string} safe - String which contains escaped html.
     * @returns {string} Unescaped html string.
     */
    unescapeHtml(safe) {
        return $('<div />').html(safe)
            .text();
    },

    /**
     * Converts image to grayscale.
     *
     * @param {HTMLCanvasElement} canvas - Canvas element with image.
     * @returns {void}
     */
    imageToGrayScale(canvas) {
        const context = canvas.getContext('2d');
        const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imgData.data;
        const redNormalizationCoefficient = 0.3;
        const greenNormalizationCoefficient = 0.59;
        const blueNormalizationCoefficient = 0.11;

        for (let i = 0, n = pixels.length; i < n; i += 4) {
            const redPartial = pixels[i] * redNormalizationCoefficient;
            const greenPartial = pixels[i + 1] * greenNormalizationCoefficient;
            const bluePartial = pixels[i + 2] * blueNormalizationCoefficient;
            const grayscale = redPartial + greenPartial + bluePartial;

            pixels[i] = grayscale;        // red
            pixels[i + 1] = grayscale;    // green
            pixels[i + 2] = grayscale;    // blue

            // pixels[i+3]              is alpha
        }

        // redraw the image in black & white
        context.putImageData(imgData, 0, 0);
    },

    /**
     * Sets a global handler for all tooltips. Once invoked, create a new
     * tooltip by merely updating a DOM node with the appropriate class (e.g.
     * <tt>tooltip-n</tt>) and the attribute <tt>content</tt>.
     *
     * @returns {void}
     */
    activateTooltips() {
        AJS.$('[data-tooltip]').tooltip({
            gravity() {
                return this.getAttribute('data-tooltip');
            },

            title() {
                return this.getAttribute('content');
            },

            html: true, // Handle multiline tooltips.

            // The following two prevent tooltips from being stuck:
            hoverable: false, // Make custom tooltips behave like native ones.
            live: true // Attach listener to document element.
        });
    },

    /**
     * Sets the tooltip to the given element.
     *
     * @param {HTMLElement} element - The element to set the tooltip to.
     * @param {string} key - The tooltip data-i18n key.
     * @param {string} position - The position of the tooltip in relation
     * to the element.
     * @returns {void}
     */
    setTooltip(element, key, position) {
        if (element !== null) {
            element.setAttribute('data-tooltip', TOOLTIP_POSITIONS[position]);
            element.setAttribute('data-i18n', `[content]${key}`);

            APP.translation.translateElement($(element));
        }
    },

    /**
     * Removes the tooltip to the given element.
     *
     * @param {HTMLElement} element - The element to remove the tooltip from.
     * @returns {void}
     */
    removeTooltip(element) {
        element.removeAttribute('data-tooltip', '');
        element.removeAttribute('data-i18n', '');
        element.removeAttribute('content', '');
    },

    /**
     * Internal util function for generating tooltip title.
     *
     * @param {HTMLElement} element - HTML element with bound tooltip.
     * @returns {string|*}
     * @private
     */
    _getTooltipText(element) {
        let title = element.getAttribute('content');
        let shortcutString;
        const shortcut = element.getAttribute('shortcut');

        if (shortcut) {
            shortcutString = KeyboardShortcut.getShortcutTooltip(shortcut);
            title += ` ${shortcutString}`;
        }

        return title;
    },

    /**
     * Inserts given child element as the first one into the container.
     *
     * @param {HTMLElement} container - The container to which new child
     * element will be added.
     * @param {HTMLElement} newChild - The new element that will be inserted
     * into the container.
     * @returns {void}
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
     * Indicates if a toolbar button is enabled.
     *
     * @param {string} name - The name of the setting section as defined in
     * interface_config.js and Toolbar.js.
     * @returns {boolean} True to indicate that the given toolbar button
     * is enabled, false - otherwise.
     */
    isButtonEnabled(name) {
        return interfaceConfig.TOOLBAR_BUTTONS.indexOf(name) !== -1
                || interfaceConfig.MAIN_TOOLBAR_BUTTONS.indexOf(name) !== -1;
    },

    /**
     * Indicates if the setting section is enabled.
     *
     * @param {string} name - The name of the setting section as defined in
     * interface_config.js and SettingsMenu.js.
     * @returns {boolean} True to indicate that the given setting section
     * is enabled, false - otherwise.
     */
    isSettingEnabled(name) {
        return interfaceConfig.SETTINGS_SECTIONS.indexOf(name) !== -1;
    },

    /**
     * Indicates if Authentication Section should be shown.
     *
     * @returns {boolean}
     */
    isAuthenticationEnabled() {
        return interfaceConfig.AUTHENTICATION_ENABLE;
    },

    /**
     * Shows / hides the element given by id.
     *
     * @param {string|HTMLElement} id - The identifier or the element
     *        to show/hide.
     * @param {boolean} visible - Flag if <tt>true</tt> to show or
     *        <tt>false</tt> to hide.
     * @returns {void}
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
     * Returns default display style for the tag.
     *
     * @param {string} tag - HTML tag string.
     * @returns {string}
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
     * @param {jQuery} jquerySelector - The jQuery selector of the element to
     * show / hide.
     * @param {boolean} isVisible - True if visible otherwise hidden.
     * @returns {void}
     */
    setVisibleBySelector(jquerySelector, isVisible) {
        if (jquerySelector && jquerySelector.length > 0) {
            jquerySelector.css('visibility', isVisible ? 'visible' : 'hidden');
        }
    },

    /**
     * Hides disabled buttons.
     *
     * @param {Object} mappings - Maps button names to ids.
     * @returns {void}
     */
    hideDisabledButtons(mappings) {
        const selector = Object.keys(mappings)
        .map(buttonName => {
            if (UIUtil.isButtonEnabled(buttonName)) {
                return null;
            }

            return `#${mappings[buttonName].id}`;
        })
        .filter(item => item)
        .join(',');

        $(selector).hide();
    },

    /**
     * Utility function for redirect.
     *
     * @param {string} url - Redirect url.
     * @returns {void}
     */
    redirect(url) {
        window.location.href = url;
    },

    /**
     * Indicates if we're currently in full screen mode.
     *
     * @returns {boolean} True to indicate that we're currently in full screen
     * mode, false otherwise.
     */
    isFullScreen() {
        return document.fullscreenElement
            || document.mozFullScreenElement
            || document.webkitFullscreenElement
            || document.msFullscreenElement;
    },

    /**
     * Exits full screen mode.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
     * @returns {void}
     */
    exitFullScreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    },

    /**
     * Enter full screen mode.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
     * @returns {void}
     */
    enterFullScreen() {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement
                .webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
    },

    /**
      * Create html attributes string out of object properties.
      *
      * @param {Object} attrs - Object with properties.
      * @returns {string} String of html element attributes.
      */
    attrsToString(attrs) {
        return Object.keys(attrs).map(
            key => ` ${key}="${attrs[key]}"`
        )
        .join(' ');
    },

    /**
     * Checks if the given DOM element is currently visible. The offsetParent
     * will be null if the "display" property of the element or any of its
     * parent containers is set to "none". This method will NOT check the
     * visibility property though.
     *
     * @param {HTMLElement} el - The DOM element we'd like
     * to check for visibility.
     * @returns {boolean}
     */
    isVisible(el) {
        return el.offsetParent !== null;
    },

    /**
     * Shows / hides the element given by selector and sets a timeout if the
     * hide delay is set to a value > 0.
     *
     * @param {string} selector - The jquery selector of the element
     * to show/hide.
     * @param {boolean} show - Flag that indicates if the element should be
     * shown or hidden.
     * @param {number} hideDelay - The value in milliseconds to wait before
     * hiding the element.
     * @returns {void}
     */
    animateShowElement(selector, show, hideDelay) {
        if (show) {
            if (!selector.is(':visible')) {
                selector.css('display', 'inline-block');
            }

            selector.fadeIn(300,
                () => selector.css({ opacity: 1 }));

            if (hideDelay && hideDelay > 0) {
                setTimeout(
                    () => {
                        selector.fadeOut(300,
                            () => selector.css({ opacity: 0 }));
                    }, hideDelay);
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
     *
     * @param {string} cssValue - The string value we obtain when
     * querying css properties.
     * @returns {number}
     */
    parseCssInt(cssValue) {
        return parseInt(cssValue, 10) || 0;
    },

    /**
     * Adds href value to 'a' link jquery object. If link value is null,
     * undefined or empty string, disables the link.
     *
     * @param {Object} aLinkElement - The jquery object.
     * @param {string} link - The link value.
     * @returns {void}
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
     * Gets an "indicator" span for a video thumbnail.
     * If element doesn't exist then creates it and appends
     * video span container.
     *
     * @param {Object} opts - Options parameter.
     * @param {string} opts.indicatorId - Identificator of indicator.
     * @param {string} opts.videoSpanId - Identificator of video span.
     * @param {string} opts.content - HTML content of indicator.
     * @param {string} opts.tooltip - Tooltip key for translation.
     *
     * @returns {HTMLSpanElement} Indicator span.
     */
    getVideoThumbnailIndicatorSpan(opts = {}) {
        const indicatorId = opts.indicatorId;
        const videoSpanId = opts.videoSpanId;
        const indicators = $(`#${videoSpanId} [id="${indicatorId}"]`);
        let indicatorSpan;

        if (indicators.length <= 0) {
            indicatorSpan = document.createElement('span');

            indicatorSpan.className = 'indicator';
            indicatorSpan.id = indicatorId;

            if (opts.content) {
                indicatorSpan.innerHTML = opts.content;
            }

            if (opts.tooltip) {
                this.setTooltip(indicatorSpan, opts.tooltip, 'top');
                APP.translation.translateElement($(indicatorSpan));
            }

            this._resizeIndicator(indicatorSpan);

            document.getElementById(videoSpanId)
                .querySelector('.videocontainer__toptoolbar')
                .appendChild(indicatorSpan);
        } else {
            indicatorSpan = indicators[0];
        }

        return indicatorSpan;
    },

    /**
     * Resizing indicator element passing via argument
     * according to the current thumbnail size.
     *
     * @param {HTMLElement} indicator - Indicator element.
     * @returns {void}
     * @private
     */
    _resizeIndicator(indicator) {
        const height = $('#localVideoContainer').height();
        const fontSize = this.getIndicatorFontSize(height);

        $(indicator).css('font-size', fontSize);
    },

    /**
     * Returns font size for indicators according to current
     * height of thumbnail.
     *
     * @param {number} height - Current height of thumbnail.
     * @returns {number} - Font size for current height.
     */
    getIndicatorFontSize(height) {
        const { SMALL, MEDIUM } = ThumbnailSizes;
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
