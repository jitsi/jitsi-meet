/* global $, APP, AJS, interfaceConfig */

import KeyboardShortcut from '../../keyboardshortcut/keyboardshortcut';

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
 var UIUtil = {

    /**
     * Returns the available video width.
     */
    getAvailableVideoWidth() {
        return window.innerWidth;
    },

    /**
     * Changes the style class of the element given by id.
     */
    buttonClick: function(id, classname) {
        // add the class to the clicked element
        $("#" + id).toggleClass(classname);
    },
    /**
     * Returns the text width for the given element.
     *
     * @param el the element
     */
    getTextWidth(el) {
        return (el.clientWidth + 1);
    },

    /**
     * Returns the text height for the given element.
     *
     * @param el the element
     */
    getTextHeight(el) {
        return (el.clientHeight + 1);
    },

    /**
     * Plays the sound given by id.
     *
     * @param id the identifier of the audio element.
     */
    playSoundNotification(id) {
        document.getElementById(id).play();
    },

    /**
     * Escapes the given text.
     */
    escapeHtml(unsafeText) {
        return $('<div/>').text(unsafeText).html();
    },

    /**
     * Unescapes the given text.
     *
     * @param {string} safe string which contains escaped html
     * @returns {string} unescaped html string.
     */
    unescapeHtml(safe) {
        return $('<div />').html(safe).text();
    },

    imageToGrayScale(canvas) {
        var context = canvas.getContext('2d');
        var imgData = context.getImageData(0, 0, canvas.width, canvas.height);
        var pixels  = imgData.data;

        for (var i = 0, n = pixels.length; i < n; i += 4) {
            var grayscale
                = pixels[i] * 0.3 + pixels[i+1] * 0.59 + pixels[i+2] * 0.11;
            pixels[i  ] = grayscale;        // red
            pixels[i+1] = grayscale;        // green
            pixels[i+2] = grayscale;        // blue
            // pixels[i+3]              is alpha
        }
        // redraw the image in black & white
        context.putImageData(imgData, 0, 0);
    },

    /**
     * Sets a global handler for all tooltips. Once invoked, create a new
     * tooltip by merely updating a DOM node with the appropriate class (e.g.
     * <tt>tooltip-n</tt>) and the attribute <tt>content</tt>.
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
     * @param element the element to set the tooltip to
     * @param key the tooltip data-i18n key
     * @param position the position of the tooltip in relation to the element
     */
    setTooltip(element, key, position) {
        if (element) {
            const selector = element.jquery ? element : $(element);

            selector.attr('data-tooltip', TOOLTIP_POSITIONS[position]);
            selector.attr('data-i18n', `[content]${key}`);

            APP.translation.translateElement(selector);
        }
    },

    /**
     * Removes the tooltip to the given element.
     *
     * @param element the element to remove the tooltip from
     */
    removeTooltip(element) {
        element.removeAttribute('data-tooltip', '');
        element.removeAttribute('data-i18n','');
        element.removeAttribute('content','');
    },

    /**
     * Internal util function for generating tooltip title.
     *
     * @param element
     * @returns {string|*}
     * @private
     */
    _getTooltipText(element) {
        let title = element.getAttribute('content');
        let shortcut = element.getAttribute('shortcut');
        if(shortcut) {
            let shortcutString = KeyboardShortcut.getShortcutTooltip(shortcut);
            title += ` ${shortcutString}`;
        }
        return title;
    },

    /**
     * Inserts given child element as the first one into the container.
     * @param container the container to which new child element will be added
     * @param newChild the new element that will be inserted into the container
     */
    prependChild(container, newChild) {
        var firstChild = container.childNodes[0];
        if (firstChild) {
            container.insertBefore(newChild, firstChild);
        } else {
            container.appendChild(newChild);
        }
    },

    /**
     * Indicates if a toolbar button is enabled.
     * @param name the name of the setting section as defined in
     * interface_config.js and Toolbar.js
     * @returns {boolean} {true} to indicate that the given toolbar button
     * is enabled, {false} - otherwise
     */
    isButtonEnabled(name) {
        return interfaceConfig.TOOLBAR_BUTTONS.indexOf(name) !== -1
                || interfaceConfig.MAIN_TOOLBAR_BUTTONS.indexOf(name) !== -1;
    },
    /**
     * Indicates if the setting section is enabled.
     *
     * @param name the name of the setting section as defined in
     * interface_config.js and SettingsMenu.js
     * @returns {boolean} {true} to indicate that the given setting section
     * is enabled, {false} - otherwise
     */
    isSettingEnabled(name) {
        return interfaceConfig.SETTINGS_SECTIONS.indexOf(name) !== -1;
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

        if (!visible)
            element.classList.add('hide');
        else if (element.classList.contains('hide')) {
            element.classList.remove('hide');
        }

        let type = this._getElementDefaultDisplay(element.tagName);
        let className = SHOW_CLASSES[type];

        if (visible) {
            element.classList.add(className);
        }
        else if (element.classList.contains(className))
            element.classList.remove(className);
    },

    /**
     * Returns default display style for the tag
     * @param tag
     * @returns {*}
     * @private
     */
    _getElementDefaultDisplay(tag) {
        let tempElement = document.createElement(tag);

        document.body.appendChild(tempElement);
        let style = window.getComputedStyle(tempElement).display;
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
            jquerySelector.css("visibility", isVisible ? "visible" : "hidden");
        }
    },

    hideDisabledButtons(mappings) {
        var selector = Object.keys(mappings)
          .map(function (buttonName) {
                return UIUtil.isButtonEnabled(buttonName)
                    ? null : "#" + mappings[buttonName].id; })
          .filter(function (item) { return item; })
          .join(',');
        $(selector).hide();
    },

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
        return document.fullscreenElement
            || document.mozFullScreenElement
            || document.webkitFullscreenElement
            || document.msFullscreenElement;
    },

    /**
     * Exits full screen mode.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
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
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
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
      * @param {Object} attrs object with properties
      * @returns {String} string of html element attributes
      */
     attrsToString(attrs) {
         return Object.keys(attrs).map(
             key => ` ${key}="${attrs[key]}"`
         ).join(' ');
     },

    /**
     * Checks if the given DOM element is currently visible. The offsetParent
     * will be null if the "display" property of the element or any of its
     * parent containers is set to "none". This method will NOT check the
     * visibility property though.
     * @param {el} The DOM element we'd like to check for visibility
     */
    isVisible(el) {
        return (el.offsetParent !== null);
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
        if(show) {
            if (!selector.is(":visible"))
                selector.css("display", "inline-block");

            selector.fadeIn(300,
                () => {selector.css({opacity: 1});}
            );

            if (hideDelay && hideDelay > 0)
                setTimeout(
                    function () {
                        selector.fadeOut(300,
                        () => {selector.css({opacity: 0});}
                    );
                }, hideDelay);
        }
        else {
            selector.fadeOut(300,
                () => {selector.css({opacity: 0});}
            );
        }
    },

    /**
     * Parses the given cssValue as an Integer. If the value is not a number
     * we return 0 instead of NaN.
     * @param cssValue the string value we obtain when querying css properties
     */
    parseCssInt(cssValue) {
        return parseInt(cssValue) || 0;
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
                "pointer-events": "none",
                "cursor": "default"
            });
        }
    },

    /**
     * Gets an "indicator" span for a video thumbnail.
     * If element doesn't exist then creates it and appends
     * video span container.
     *
     * @param {object} opts
     * @param opts.indicatorId {String} - identificator of indicator
     * @param opts.videoSpanId {String} - identificator of video span
     * @param opts.content {String} HTML content of indicator
     * @param opts.tooltip {String} - tooltip key for translation
     *
     * @returns {HTMLSpanElement} indicatorSpan
     */
    getVideoThumbnailIndicatorSpan(opts = {}) {
        let indicatorId = opts.indicatorId;
        let videoSpanId = opts.videoSpanId;
        let indicators = $(`#${videoSpanId} [id="${indicatorId}"]`);
        let indicatorSpan;

        if (indicators.length <= 0) {
            indicatorSpan = document.createElement('span');

            indicatorSpan.className = 'indicator';
            indicatorSpan.id = indicatorId;

            if(opts.content) {
                indicatorSpan.innerHTML = opts.content;
            }

            if (opts.tooltip) {
                this.setTooltip(indicatorSpan, opts.tooltip, "top");
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
     * according to the current thumbnail size
     * @param {HTMLElement} indicator - indicator element
     * @private
     */
    _resizeIndicator(indicator) {
        let height = $('#localVideoContainer').height();
        let fontSize = this.getIndicatorFontSize(height);
        $(indicator).css('font-size', fontSize);
    },

    /**
     * Returns font size for indicators according to current
     * height of thumbnail
     * @param {Number} - height - current height of thumbnail
     * @returns {Number} - font size for current height
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
