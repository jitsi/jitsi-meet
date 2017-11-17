import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Image, View } from 'react-native';

import { CachedImage, ImageCache } from '../../../mobile/image-cache';
import { Platform } from '../../react';
import { ColorPalette } from '../../styles';

/**
 * The default image/source to be used in case none is specified or the
 * specified one fails to load.
 *
 * XXX The relative path to the default/stock (image) file is defined by the
 * {@code const} {@code DEFAULT_AVATAR_RELATIVE_PATH}. Unfortunately, the
 * packager of React Native cannot deal with it early enough for the following
 * {@code require} to succeed at runtime. Anyway, be sure to synchronize the
 * relative path on Web and mobile for the purposes of consistency.
 *
 * @private
 * @type {string}
 */
const _DEFAULT_SOURCE = require('../../../../../images/avatar.png');

/**
 * Implements an avatar as a React Native/mobile {@link Component}.
 */
export default class Avatar extends Component {
    /**
     * Avatar component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The optional style to add to the {@link Avatar} in order to customize
         * its base look (and feel).
         */
        style: PropTypes.object,

        /**
         * The URI of the {@link Avatar}.
         *
         * @type {string}
         */
        uri: PropTypes.string
    };

    /**
     * Initializes a new Avatar instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Fork (in Facebook/React speak) the prop uri because Image will
        // receive it through a source object. Additionally, other props may be
        // forked as well.
        this.componentWillReceiveProps(props);
    }

    /**
     * Notifies this mounted React Component that it will receive new props.
     * Forks (in Facebook/React speak) the prop {@code uri} because
     * {@link Image} will receive it through a {@code source} object.
     * Additionally, other props may be forked as well.
     *
     * @inheritdoc
     * @param {Object} nextProps - The read-only React Component props that this
     * instance will receive.
     * @returns {void}
     */
    componentWillReceiveProps(nextProps) {
        // uri
        const prevURI = this.props && this.props.uri;
        const nextURI = nextProps && nextProps.uri;
        const assignState = !this.state;

        if (prevURI !== nextURI || assignState) {
            const nextState = {
                backgroundColor: this._getBackgroundColor(nextProps),

                /**
                 * The source of the {@link Image} which is the actual
                 * representation of this {@link Avatar}. The state
                 * {@code source} was explicitly introduced in order to reduce
                 * unnecessary renders.
                 *
                 * @type {{
                 *     uri: string
                 * }}
                 */
                source: _DEFAULT_SOURCE
            };

            if (assignState) {
                // eslint-disable-next-line react/no-direct-mutation-state
                this.state = nextState;
            } else {
                this.setState(nextState);
            }

            // XXX @lyubomir: My logic for the character # bellow is as follows:
            // - Technically, URI is supposed to start with a scheme and scheme
            //   cannot contain the character #.
            // - Technically, the character # in URI signals the start of the
            //   fragment/hash.
            // - Technically, the fragment/hash does not imply a retrieval
            //   action.
            // - Practically, the fragment/hash does not always mandate a
            //   retrieval action. For example, an HTML anchor with an href that
            //   starts with the character # does not cause a Web browser to
            //   initiate a retrieval action.
            // So I'll use the character # at the start of URI to not initiate
            // an image retrieval action.
            if (nextURI && !nextURI.startsWith('#')) {
                const nextSource = { uri: nextURI };
                const observer = () => {
                    this._unmounted || this.setState((prevState, props) => {
                        if (props.uri === nextURI
                                && (!prevState.source
                                    || prevState.source.uri !== nextURI)) {
                            return { source: nextSource };
                        }

                        return {};
                    });
                };

                // Wait for the source/URI to load.
                if (ImageCache) {
                    ImageCache.get().on(
                        nextSource,
                        observer,
                        /* immutable */ true);
                } else if (assignState) {
                    // eslint-disable-next-line react/no-direct-mutation-state
                    this.state = {
                        ...this.state,
                        source: nextSource
                    };
                } else {
                    observer();
                }
            }
        }
    }

    /**
     * Notifies this {@code Component} that it will be unmounted and destroyed
     * and, most importantly, that it should no longer call
     * {@link #setState(Object)}. {@code Avatar} needs it because it downloads
     * images via {@link ImageCache} which will asynchronously notify about
     * success.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        this._unmounted = true;
    }

    /**
     * Computes a hash over the URI and returns a HSL background color. We use
     * 75% as lightness, for nice pastel style colors.
     *
     * @param {Object} props - The read-only React {@code Component} props from
     * which the background color is to be generated.
     * @private
     * @returns {string} - The HSL CSS property.
     */
    _getBackgroundColor({ uri }) {
        if (!uri) {
            // @lyubomir: I'm leaving @saghul's implementation which picks up a
            // random color bellow so that we have it in the source code in
            // case we decide to use it in the future. However, I think at the
            // time of this writing that the randomness reduces the
            // predictability which React is supposed to bring to our app.
            return ColorPalette.white;
        }

        let hash = 0;

        if (typeof uri === 'string') {
            /* eslint-disable no-bitwise */

            for (let i = 0; i < uri.length; i++) {
                hash = uri.charCodeAt(i) + ((hash << 5) - hash);
                hash |= 0; // Convert to 32-bit integer
            }

            /* eslint-enable no-bitwise */
        } else {
            // @saghul: If we have no URI yet, we have no data to hash from. So
            // use a random value.
            hash = Math.floor(Math.random() * 360);
        }

        return `hsl(${hash % 360}, 100%, 75%)`;
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        // Propagate all props of this Avatar but the ones consumed by this
        // Avatar to the Image it renders.
        const {
            /* eslint-disable no-unused-vars */

            // The following are forked in state:
            uri: forked0,

            /* eslint-enable no-unused-vars */

            style,
            ...props
        } = this.props;
        const {
            backgroundColor,
            source
        } = this.state;

        // If we're rendering the _DEFAULT_SOURCE, then we want to do some
        // additional fu like having automagical colors generated per
        // participant, transparency to make the intermediate state while
        // downloading the remote image a little less "in your face", etc.
        let styleWithBackgroundColor;

        if (source === _DEFAULT_SOURCE && backgroundColor) {
            styleWithBackgroundColor = {
                ...style,

                backgroundColor,

                // FIXME @lyubomir: Without the opacity bellow I feel like the
                // avatar colors are too strong. Besides, we use opacity for the
                // ToolbarButtons. That's where I copied the value from and we
                // may want to think about "standardizing" the opacity in the
                // app in a way similar to ColorPalette.
                opacity: 0.1,
                overflow: 'hidden'
            };
        }

        // If we're styling with backgroundColor, we need to wrap the Image in a
        // View because of a bug in React Native for Android:
        // https://github.com/facebook/react-native/issues/3198
        let imageStyle;
        let viewStyle;

        if (styleWithBackgroundColor) {
            if (Platform.OS === 'android') {
                imageStyle = style;
                viewStyle = styleWithBackgroundColor;
            } else {
                imageStyle = styleWithBackgroundColor;
            }
        } else {
            imageStyle = style;
        }

        let element
            = React.createElement(

                // XXX CachedImage removed support for images which clearly do
                // not need caching.
                typeof source === 'number' ? Image : CachedImage,
                {
                    ...props,

                    resizeMode: 'contain',
                    source,
                    style: imageStyle
                });

        if (viewStyle) {
            element = React.createElement(View, { style: viewStyle }, element);
        }

        return element;
    }
}
