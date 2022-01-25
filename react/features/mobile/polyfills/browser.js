import { DOMParser } from '@xmldom/xmldom';
import { Platform } from 'react-native';
import BackgroundTimer from 'react-native-background-timer';

import 'promise.allsettled/auto'; // Promise.allSettled.
import 'react-native-url-polyfill/auto'; // Complete URL polyfill.

import Storage from './Storage';

/**
 * Implements an absolute minimum of the common logic of
 * {@code Document.querySelector} and {@code Element.querySelector}. Implements
 * the most simple of selectors necessary to satisfy the call sites at the time
 * of this writing (i.e. Select by tagName).
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
    // DOMParser
    //
    // Required by:
    // - lib-jitsi-meet requires this if using WebSockets
    global.DOMParser = DOMParser;

    // addEventListener
    //
    // Required by:
    // - jQuery
    if (typeof global.addEventListener === 'undefined') {
        // eslint-disable-next-line no-empty-function
        global.addEventListener = () => {};
    }

    // removeEventListener
    //
    // Required by:
    // - features/base/conference/middleware
    if (typeof global.removeEventListener === 'undefined') {
        // eslint-disable-next-line no-empty-function
        global.removeEventListener = () => {};
    }

    // document
    //
    // Required by:
    // - jQuery
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

        // document.cookie
        //
        // Required by:
        // - herment
        if (typeof document.cookie === 'undefined') {
            document.cookie = '';
        }

        // document.implementation.createHTMLDocument
        //
        // Required by:
        // - jQuery
        if (typeof document.implementation.createHTMLDocument === 'undefined') {
            document.implementation.createHTMLDocument = function(title = '') {
                const htmlDocument
                    = new DOMParser().parseFromString(
                        `<html>
                            <head><title>${title}</title></head>
                            <body></body>
                        </html>`,
                        'text/xml');

                Object.defineProperty(htmlDocument, 'body', {
                    get() {
                        return htmlDocument.getElementsByTagName('body')[0];
                    }
                });

                return htmlDocument;
            };
        }

        // Element.querySelector
        //
        // Required by:
        // - lib-jitsi-meet/modules/xmpp
        const elementPrototype
            = Object.getPrototypeOf(document.documentElement);

        if (elementPrototype) {
            if (typeof elementPrototype.querySelector === 'undefined') {
                elementPrototype.querySelector = function(selectors) {
                    return _querySelector(this, selectors);
                };
            }

            // Element.remove
            //
            // Required by:
            // - lib-jitsi-meet ChatRoom#onPresence parsing
            if (typeof elementPrototype.remove === 'undefined') {
                elementPrototype.remove = function() {
                    if (this.parentNode !== null) {
                        this.parentNode.removeChild(this);
                    }
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

            // Element.children
            //
            // Required by:
            // - lib-jitsi-meet ChatRoom#onPresence parsing
            if (!elementPrototype.hasOwnProperty('children')) {
                Object.defineProperty(elementPrototype, 'children', {
                    get() {
                        const nodes = this.childNodes;
                        const children = [];
                        let i = 0;
                        let node = nodes[i];

                        while (node) {
                            if (node.nodeType === 1) {
                                children.push(node);
                            }
                            i += 1;
                            node = nodes[i];
                        }

                        return children;
                    }
                });
            }
        }

        global.document = document;
    }

    // location
    if (typeof global.location === 'undefined') {
        global.location = {
            href: '',

            // Required by:
            // - lib-jitsi-meet/modules/xmpp/xmpp.js
            search: ''
        };
    }

    const { navigator } = global;

    if (navigator) {
        // userAgent
        //
        // Required by:
        // - lib-jitsi-meet/modules/browser/BrowserDetection.js
        let userAgent = navigator.userAgent || '';

        // react-native/version
        const { name, version } = require('react-native/package.json');
        let rn = name || 'react-native';

        version && (rn += `/${version}`);
        if (userAgent.indexOf(rn) === -1) {
            userAgent = userAgent ? `${rn} ${userAgent}` : rn;
        }

        // (OS version)
        const os = `(${Platform.OS} ${Platform.Version})`;

        if (userAgent.indexOf(os) === -1) {
            userAgent = userAgent ? `${userAgent} ${os}` : os;
        }

        navigator.userAgent = userAgent;
    }

    // WebRTC
    require('./webrtc');

    // Performance API

    // RN only provides the now() method, since the polyfill refers the global
    // performance object itself we extract it here to avoid infinite recursion.
    const performanceNow = global.performance.now;

    const perf = require('react-native-performance');

    global.performance = perf.default;
    global.performance.now = performanceNow;
    global.PerformanceObserver = perf.PerformanceObserver;

    // CallStats
    //
    // Required by:
    // - lib-jitsi-meet
    require('react-native-callstats/csio-polyfill');
    global.callstats = require('react-native-callstats/callstats');

    // XMLHttpRequest
    if (global.XMLHttpRequest) {
        const { prototype } = global.XMLHttpRequest;

        // XMLHttpRequest.responseXML
        //
        // Required by:
        // - Strophe
        if (prototype && !prototype.hasOwnProperty('responseXML')) {
            Object.defineProperty(prototype, 'responseXML', {
                get() {
                    const { responseText } = this;

                    return (
                        responseText
                            && new DOMParser().parseFromString(
                                responseText,
                                'text/xml'));
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
    if (Platform.OS === 'android') {
        global.clearTimeout = BackgroundTimer.clearTimeout.bind(BackgroundTimer);
        global.clearInterval = BackgroundTimer.clearInterval.bind(BackgroundTimer);
        global.setInterval = BackgroundTimer.setInterval.bind(BackgroundTimer);
        global.setTimeout = (fn, ms = 0) => BackgroundTimer.setTimeout(fn, ms);
    }

    // localStorage
    if (typeof global.localStorage === 'undefined') {
        global.localStorage = new Storage('@jitsi-meet/');
    }

    // sessionStorage
    //
    // Required by:
    // - herment
    // - Strophe
    if (typeof global.sessionStorage === 'undefined') {
        global.sessionStorage = new Storage();
    }

})(global || window || this); // eslint-disable-line no-invalid-this
