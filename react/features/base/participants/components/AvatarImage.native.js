import React, { Component } from 'react';
import { Image, View } from 'react-native';

import { Platform } from '../../react';

/**
 * The default avatar to be used, in case the requested URI is not available
 * or fails to load. It is an inline version of images/avatar2.png.
 *
 * @type {string}
 */
const DEFAULT_AVATAR = require('./defaultAvatar.png');

/**
 * The number of milliseconds to wait when the avatar URI is undefined before we
 * start showing a default locally generated one. Note that since we have no
 * URI, we have nothing we can cache, so the color will be random.
 *
 * @type {number}
 */
const UNDEFINED_AVATAR_TIMEOUT = 1000;

/**
 * Implements an Image component wrapper, which returns a default image if the
 * requested one fails to load. The default image background is chosen by
 * hashing the URL of the image.
 */
export default class AvatarImage extends Component {
    /**
     * AvatarImage component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * If set to <tt>true</tt> it will not load the URL, but will use the
         * default instead.
         */
        forceDefault: React.PropTypes.bool,

        /**
         * The source the {@link Image}.
         */
        source: React.PropTypes.object,

        /**
         * The optional style to add to the {@link Image} in order to customize
         * its base look (and feel).
         */
        style: React.PropTypes.object
    };

    /**
     * Initializes new AvatarImage component.
     *
     * @param {Object} props - Component props.
     */
    constructor(props) {
        super(props);

        this.state = {
            failed: false,
            showDefault: false
        };

        this.componentWillReceiveProps(props);

        this._onError = this._onError.bind(this);
    }

    /**
     * Notifies this mounted React Component that it will receive new props.
     * If the URI is undefined, wait {@code UNDEFINED_AVATAR_TIMEOUT} ms and
     * start showing a default locally generated avatar afterwards.
     *
     * Once a URI is passed, it will be rendered instead, except if loading it
     * fails, in which case we fallback to a locally generated avatar again.
     *
     * @inheritdoc
     * @param {Object} nextProps - The read-only React Component props that this
     * instance will receive.
     * @returns {void}
     */
    componentWillReceiveProps(nextProps) {
        const prevSource = this.props.source;
        const prevURI = prevSource && prevSource.uri;
        const nextSource = nextProps.source;
        const nextURI = nextSource && nextSource.uri;

        if (typeof prevURI === 'undefined') {
            clearTimeout(this._timeout);
            if (typeof nextURI === 'undefined') {
                this._timeout
                    = setTimeout(
                        () => this.setState({ showDefault: true }),
                        UNDEFINED_AVATAR_TIMEOUT);
            } else {
                this.setState({ showDefault: nextProps.forceDefault });
            }
        }
    }

    /**
     * Clear the timer just in case. See {@code componentWillReceiveProps} for
     * details.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        clearTimeout(this._timeout);
    }

    /**
     * Computes a hash over the URI and returns a HSL background color. We use
     * 75% as lightness, for nice pastel style colors.
     *
     * @private
     * @returns {string} - The HSL CSS property.
     */
    _getBackgroundColor() {
        const uri = this.props.source.uri;
        let hash = 0;

        // If we have no URI yet we have no data to hash from, so use a random
        // value.
        if (typeof uri === 'undefined') {
            hash = Math.floor(Math.random() * 360);
        } else {
            /* eslint-disable no-bitwise */

            for (let i = 0; i < uri.length; i++) {
                hash = uri.charCodeAt(i) + ((hash << 5) - hash);
                hash |= 0;  // Convert to 32bit integer
            }

            /* eslint-enable no-bitwise */
        }

        return `hsl(${hash % 360}, 100%, 75%)`;
    }

    /**
     * Error handler for image loading. When an image fails to load we'll mark
     * it as failed and load the default URI instead.
     *
     * @private
     * @returns {void}
     */
    _onError() {
        this.setState({ failed: true });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const { failed, showDefault } = this.state;
        const {
            // The following is/are forked in state:
            forceDefault, // eslint-disable-line no-unused-vars

            source,
            style,
            ...props
        } = this.props;

        if (failed || showDefault) {
            const coloredBackground = {
                ...style,
                backgroundColor: this._getBackgroundColor(),
                overflow: 'hidden'
            };

            // We need to wrap the Image in a View because of a bug in React
            // Native for Android:
            // https://github.com/facebook/react-native/issues/3198
            const workaround3198 = Platform.OS === 'android';
            let element = React.createElement(Image, {
                ...props,
                source: DEFAULT_AVATAR,
                style: workaround3198 ? style : coloredBackground
            });

            if (workaround3198) {
                element
                    = React.createElement(
                        View,
                        { style: coloredBackground },
                        element);
            }

            return element;
        } else if (typeof source.uri === 'undefined') {
            return null;
        }

        // We have a URI and it's time to render it.
        return (
            <Image
                { ...props }
                onError = { this._onError }
                source = { source }
                style = { style } />
        );
    }
}
