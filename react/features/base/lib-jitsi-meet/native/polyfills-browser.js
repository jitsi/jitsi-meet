import Iterator from 'es6-iterator';
import BackgroundTimer from 'react-native-background-timer';
import 'url-polyfill'; // Polyfill for URL constructor

/**
 * Gets the first common prototype of two specified Objects (treating the
 * objects themselves as prototypes as well).
 *
 * @param {Object} a - The first prototype chain to climb in search of a common
 * prototype.
 * @param {Object} b - The second prototype chain to climb in search of a common
 * prototype.
 * @returns {Object|undefined} - The first common prototype of a and b.
 */
function _getCommonPrototype(a, b) {
    // Allow the arguments to be prototypes themselves.
    if (a === b) {
        return a;
    }

    let p;

    if ((p = Object.getPrototypeOf(a)) && (p = _getCommonPrototype(b, p))) {
        return p;
    }
    if ((p = Object.getPrototypeOf(b)) && (p = _getCommonPrototype(a, p))) {
        return p;
    }

    return undefined;
}

/**
 * Implements an absolute minimum of the common logic of Document.querySelector
 * and Element.querySelector. Implements the most simple of selectors necessary
 * to satisfy the call sites at the time of this writing i.e. select by tagName.
 *
 * @param {Node} node - The Node which is the root of the tree to query.
 * @param {string} selectors - The group of CSS selectors to match on.
 * @returns {Element} - The first Element which is a descendant of the specified
 * node and matches the specified group of selectors.
 */
function _querySelector(node, selectors) {
    let element = null;

    node && _visitNode(node, n => {
        if (n.nodeType === 1 /* ELEMENT_NODE */
                && n.nodeName === selectors) {
            element = n;

            return true;
        }

        return false;
    });

    return element;
}

/**
 * Visits each Node in the tree of a specific root Node (using depth-first
 * traversal) and invokes a specific callback until the callback returns true.
 *
 * @param {Node} node - The root Node which represents the tree of Nodes to
 * visit.
 * @param {Function} callback - The callback to invoke with each visited Node.
 * @returns {boolean} - True if the specified callback returned true for a Node
 * (at which point the visiting stopped); otherwise, false.
 */
function _visitNode(node, callback) {
    if (callback(node)) {
        return true;
    }

    /* eslint-disable no-param-reassign, no-extra-parens */

    if ((node = node.firstChild)) {
        do {
            if (_visitNode(node, callback)) {
                return true;
            }
        } while ((node = node.nextSibling));
    }

    /* eslint-enable no-param-reassign, no-extra-parens */

    return false;
}

(global => {
    const DOMParser = require('xmldom').DOMParser;

    // addEventListener
    //
    // Required by:
    // - jQuery
    if (typeof global.addEventListener === 'undefined') {
        // eslint-disable-next-line no-empty-function
        global.addEventListener = () => {};
    }

    // Array.prototype[@@iterator]
    //
    // Required by:
    // - for...of statement use(s) in lib-jitsi-meet
    const arrayPrototype = Array.prototype;

    if (typeof arrayPrototype['@@iterator'] === 'undefined') {
        arrayPrototype['@@iterator'] = function() {
            return new Iterator(this);
        };
    }

    // document
    //
    // Required by:
    // - jQuery
    // - lib-jitsi-meet/modules/RTC/adapter.screenshare.js
    // - Strophe
    if (typeof global.document === 'undefined') {
        const document
            = new DOMParser().parseFromString(
                '<html><head></head><body></body></html>',
                'text/xml');

        // document.addEventListener
        //
        // Required by:
        // - jQuery
        if (typeof document.addEventListener === 'undefined') {
            // eslint-disable-next-line no-empty-function
            document.addEventListener = () => {};
        }

        // Document.querySelector
        //
        // Required by:
        // - strophejs-plugins/caps/strophe.caps.jsonly.js
        const documentPrototype = Object.getPrototypeOf(document);

        if (documentPrototype) {
            if (typeof documentPrototype.querySelector === 'undefined') {
                documentPrototype.querySelector = function(selectors) {
                    return _querySelector(this.elementNode, selectors);
                };
            }
        }

        // Element.querySelector
        //
        // Required by:
        // - strophejs-plugins/caps/strophe.caps.jsonly.js
        const elementPrototype
            = Object.getPrototypeOf(document.documentElement);

        if (elementPrototype) {
            if (typeof elementPrototype.querySelector === 'undefined') {
                elementPrototype.querySelector = function(selectors) {
                    return _querySelector(this, selectors);
                };
            }

            // Element.innerHTML
            //
            // Required by:
            // - jQuery's .append method
            if (!elementPrototype.hasOwnProperty('innerHTML')) {
                Object.defineProperty(elementPrototype, 'innerHTML', {
                    get() {
                        return this.childNodes.toString();
                    },

                    set(innerHTML) {
                        // MDN says: removes all of element's children, parses
                        // the content string and assigns the resulting nodes as
                        // children of the element.

                        // Remove all of element's children.
                        this.textContent = '';

                        // Parse the content string.
                        const d
                            = new DOMParser().parseFromString(
                                `<div>${innerHTML}</div>`,
                                'text/xml');

                        // Assign the resulting nodes as children of the
                        // element.
                        const documentElement = d.documentElement;
                        let child;

                        // eslint-disable-next-line no-cond-assign
                        while (child = documentElement.firstChild) {
                            this.appendChild(child);
                        }
                    }
                });
            }
        }

        // FIXME There is a weird infinite loop related to console.log and
        // Document and/or Element at the time of this writing. Work around it
        // by patching Node and/or overriding console.log.
        const nodePrototype
            = _getCommonPrototype(documentPrototype, elementPrototype);

        if (nodePrototype

                // XXX The intention was to find Node from which Document and
                // Element extend. If for whatever reason we've reached Object,
                // then it doesn't sound like what expected.
                && nodePrototype !== Object.getPrototypeOf({})) {
            // Override console.log.
            const console = global.console;

            if (console) {
                const loggerLevels = require('jitsi-meet-logger').levels;

                Object.keys(loggerLevels).forEach(key => {
                    const level = loggerLevels[key];
                    const consoleLog = console[level];

                    /* eslint-disable prefer-rest-params */

                    if (typeof consoleLog === 'function') {
                        console[level] = function(...args) {
                            const length = args.length;

                            for (let i = 0; i < length; ++i) {
                                let arg = args[i];

                                if (arg
                                        && typeof arg !== 'string'

                                        // Limit the console.log override to
                                        // Node (instances).
                                        && nodePrototype.isPrototypeOf(arg)) {
                                    const toString = arg.toString;

                                    if (toString) {
                                        arg = toString.call(arg);
                                    }
                                }
                                args[i] = arg;
                            }

                            consoleLog.apply(this, args);
                        };
                    }

                    /* eslint-enable prefer-rest-params */
                });
            }
        }

        global.document = document;
    }

    // location
    if (typeof global.location === 'undefined') {
        global.location = {
            href: ''
        };
    }

    const navigator = global.navigator;

    if (navigator) {
        // platform
        //
        // Required by:
        // - lib-jitsi-meet/modules/RTC/adapter.screenshare.js
        if (typeof navigator.platform === 'undefined') {
            navigator.platform = '';
        }

        // plugins
        //
        // Required by:
        // - lib-jitsi-meet/modules/RTC/adapter.screenshare.js
        if (typeof navigator.plugins === 'undefined') {
            navigator.plugins = [];
        }

        // userAgent
        //
        // Required by:
        // - lib-jitsi-meet/modules/RTC/adapter.screenshare.js
        // - lib-jitsi-meet/modules/RTC/RTCBrowserType.js
        (() => {
            const reactNativePackageJSON = require('react-native/package.json');
            let userAgent = reactNativePackageJSON.name || 'react-native';

            const version = reactNativePackageJSON.version;

            if (version) {
                userAgent += `/${version}`;
            }

            if (typeof navigator.userAgent !== 'undefined') {
                const s = navigator.userAgent.toString();

                if (s.length > 0 && s.indexOf(userAgent) === -1) {
                    userAgent = `${s} ${userAgent}`;
                }
            }

            navigator.userAgent = userAgent;
        })();
    }

    // performance
    if (typeof global.performance === 'undefined') {
        global.performance = {
            now() {
                return 0;
            }
        };
    }

    // sessionStorage
    //
    // Required by:
    // - Strophe
    if (typeof global.sessionStorage === 'undefined') {
        global.sessionStorage = {
            /* eslint-disable no-empty-function */
            getItem() {},
            removeItem() {},
            setItem() {}

            /* eslint-enable no-empty-function */
        };
    }

    // WebRTC
    require('./polyfills-webrtc');

    // XMLHttpRequest
    if (global.XMLHttpRequest) {
        const prototype = global.XMLHttpRequest.prototype;

        // XMLHttpRequest.responseXML
        //
        // Required by:
        // - Strophe
        if (prototype && !prototype.hasOwnProperty('responseXML')) {
            Object.defineProperty(prototype, 'responseXML', {
                get() {
                    const responseText = this.responseText;
                    let responseXML;

                    if (responseText) {
                        responseXML
                            = new DOMParser().parseFromString(
                                responseText,
                                'text/xml');
                    }

                    return responseXML;
                }
            });
        }
    }

    // Timers
    //
    // React Native's timers won't run while the app is in the background, this
    // is a known limitation. Replace them with a background-friendly
    // alternative.
    //
    // Required by:
    // - lib-jitsi-meet
    // - Strophe
    global.clearTimeout = window.clearTimeout = BackgroundTimer.clearTimeout;
    global.clearInterval = window.clearInterval = BackgroundTimer.clearInterval;
    global.setInterval = window.setInterval = BackgroundTimer.setInterval;
    global.setTimeout = window.setTimeout = BackgroundTimer.setTimeout;

})(global || window || this); // eslint-disable-line no-invalid-this
