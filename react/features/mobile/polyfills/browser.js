import { querySelector, querySelectorAll } from '@jitsi/js-utils/polyfills/querySelectorPolyfill';
import { DOMParser } from '@xmldom/xmldom';
import { atob, btoa } from 'abab';
import { NativeModules, Platform } from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
import { TextDecoder, TextEncoder } from 'text-encoding';

import 'promise.withresolvers/auto'; // Promise.withResolvers.
import 'react-native-url-polyfill/auto'; // Complete URL polyfill.

import Storage from './Storage';

const { AppInfo } = NativeModules;

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
                    return querySelector(this, selectors);
                };
            }

            // Element.querySelectorAll
            //
            // Required by:
            // - lib-jitsi-meet XMLUtils
            if (typeof elementPrototype.querySelectorAll === 'undefined') {
                elementPrototype.querySelectorAll = function(selectors) {
                    return querySelectorAll(this, selectors);
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

        // Document.querySelector
        //
        // Required by:
        // - lib-jitsi-meet -> XMLUtils.ts -> parseXML
        if (typeof document.querySelector === 'undefined') {
            document.querySelector = function(selectors) {
                return querySelector(this, selectors);
            };
        }

        // Document.querySelectorAll
        //
        // Required by:
        // - lib-jitsi-meet -> XMLUtils.ts -> parseXML
        if (typeof document.querySelectorAll === 'undefined') {
            document.querySelectorAll = function(selectors) {
                return querySelectorAll(this, selectors);
            };
        }

        // Also add querySelector methods to Document.prototype for DOMParser-created documents
        const documentPrototype = Object.getPrototypeOf(document);

        if (documentPrototype) {
            // Document.querySelector
            //
            // Required by:
            // - lib-jitsi-meet -> XMLUtils.ts -> parseXML
            if (typeof documentPrototype.querySelector === 'undefined') {
                documentPrototype.querySelector = function(selectors) {
                    return querySelector(this, selectors);
                };
            }

            // Document.querySelectorAll
            //
            // Required by:
            // - lib-jitsi-meet -> XMLUtils.ts -> parseXML
            if (typeof documentPrototype.querySelectorAll === 'undefined') {
                documentPrototype.querySelectorAll = function(selectors) {
                    return querySelectorAll(this, selectors);
                };
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

        // React Native version
        const { reactNativeVersion } = Platform.constants;
        const rnVersion
            = `react-native/${reactNativeVersion.major}.${reactNativeVersion.minor}.${reactNativeVersion.patch}`;

        // (OS version)
        const os = `${Platform.OS.toLowerCase()}/${Platform.Version}`;

        // SDK
        const liteTxt = AppInfo.isLiteSDK ? '-lite' : '';
        const sdkVersion = `JitsiMeetSDK/${AppInfo.sdkVersion}${liteTxt}`;

        const parts = [
            navigator.userAgent ?? '',
            sdkVersion,
            os,
            rnVersion
        ];

        navigator.userAgent = parts.filter(Boolean).join(' ');
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

    // Timers
    //
    // React Native's timers won't run while the app is in the background, this
    // is a known limitation. Replace them with a background-friendly alternative.
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

    global.TextDecoder = TextDecoder;
    global.TextEncoder = TextEncoder;

    // atob
    //
    // Required by:
    // - Strophe
    if (typeof global.atob === 'undefined') {
        global.atob = atob;
    }

    // btoa
    //
    // Required by:
    // - Strophe
    if (typeof global.btoa === 'undefined') {
        global.btoa = btoa;
    }

})(global || window || this); // eslint-disable-line no-invalid-this
