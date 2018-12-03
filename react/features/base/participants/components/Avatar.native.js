// @flow

import React, { Component, Fragment } from 'react';
import { Image, View } from 'react-native';
import FastImage from 'react-native-fast-image';

import { ColorPalette } from '../../styles';

import styles from './styles';

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
 * The type of the React {@link Component} props of {@link Avatar}.
 */
type Props = {

    /**
     * The size for the {@link Avatar}.
     */
    size: number,


    /**
     * The URI of the {@link Avatar}.
     */
    uri: string
};

/**
 * The type of the React {@link Component} state of {@link Avatar}.
 */
type State = {
    backgroundColor: string,
    source: ?{ uri: string },
    useDefaultAvatar: boolean
};

/**
 * Implements an avatar as a React Native/mobile {@link Component}.
 */
export default class Avatar extends Component<Props, State> {
    /**
     * The indicator which determines whether this {@code Avatar} has been
     * unmounted.
     */
    _unmounted: ?boolean;

    /**
     * Initializes a new Avatar instance.
     *
     * @param {Props} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onAvatarLoaded = this._onAvatarLoaded.bind(this);

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
     * @param {Props} nextProps - The read-only React Component props that this
     * instance will receive.
     * @returns {void}
     */
    componentWillReceiveProps(nextProps: Props) {
        // uri
        const prevURI = this.props && this.props.uri;
        const nextURI = nextProps && nextProps.uri;
        const assignState = !this.state;

        if (prevURI !== nextURI || assignState) {
            const nextState = {
                backgroundColor: this._getBackgroundColor(nextProps),
                source: undefined,
                useDefaultAvatar: true
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

                if (assignState) {
                    // eslint-disable-next-line react/no-direct-mutation-state
                    this.state = {
                        ...this.state,
                        source: nextSource
                    };
                } else {
                    this._unmounted || this.setState((prevState, props) => {
                        if (props.uri === nextURI
                                && (!prevState.source
                                    || prevState.source.uri !== nextURI)) {
                            return { source: nextSource };
                        }

                        return {};
                    });
                }
            }
        }
    }

    /**
     * Notifies this {@code Component} that it will be unmounted and destroyed,
     * and most importantly, that it should no longer call
     * {@link #setState(Object)}. The {@code Avatar} needs it because it
     * downloads images via {@link ImageCache} which will asynchronously notify
     * about success.
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
            return ColorPalette.white;
        }

        let hash = 0;

        /* eslint-disable no-bitwise */

        for (let i = 0; i < uri.length; i++) {
            hash = uri.charCodeAt(i) + ((hash << 5) - hash);
            hash |= 0; // Convert to 32-bit integer
        }

        /* eslint-enable no-bitwise */

        return `hsl(${hash % 360}, 100%, 75%)`;
    }

    /**
     * Helper which computes the style for the {@code Image} / {@code FastImage}
     * component.
     *
     * @private
     * @returns {Object}
     */
    _getImageStyle() {
        const { size } = this.props;

        return {
            ...styles.avatar,
            borderRadius: size / 2,
            height: size,
            width: size
        };
    }

    _onAvatarLoaded: () => void;

    /**
     * Handler called when the remote image was loaded. When this happens we
     * show that instead of the default locally generated one.
     *
     * @private
     * @returns {void}
     */
    _onAvatarLoaded() {
        this._unmounted || this.setState({ useDefaultAvatar: false });
    }

    /**
     * Renders a default, locally generated avatar image.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderDefaultAvatar() {
        // When using a local image, react-native-fastimage falls back to a
        // regular Image, so we need to wrap it in a view to make it round.
        // https://github.com/facebook/react-native/issues/3198

        const { backgroundColor, useDefaultAvatar } = this.state;
        const imageStyle = this._getImageStyle();
        const viewStyle = {
            ...imageStyle,

            backgroundColor,
            display: useDefaultAvatar ? 'flex' : 'none',

            // FIXME @lyubomir: Without the opacity bellow I feel like the
            // avatar colors are too strong. Besides, we use opacity for the
            // ToolbarButtons. That's where I copied the value from and we
            // may want to think about "standardizing" the opacity in the
            // app in a way similar to ColorPalette.
            opacity: 0.1,
            overflow: 'hidden'
        };

        return (
            <View style = { viewStyle }>
                <Image

                    // The Image adds a fade effect without asking, so lets
                    // explicitly disable it. More info here:
                    // https://github.com/facebook/react-native/issues/10194
                    fadeDuration = { 0 }
                    resizeMode = 'contain'
                    source = { _DEFAULT_SOURCE }
                    style = { imageStyle } />
            </View>
        );
    }

    /**
     * Renders an avatar using a remote image.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderAvatar() {
        const { source, useDefaultAvatar } = this.state;
        const style = {
            ...this._getImageStyle(),
            display: useDefaultAvatar ? 'none' : 'flex'
        };

        return (
            <FastImage
                onLoad = { this._onAvatarLoaded }
                resizeMode = 'contain'
                source = { source }
                style = { style } />
        );
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const { source, useDefaultAvatar } = this.state;

        return (
            <Fragment>
                { source && this._renderAvatar() }
                { useDefaultAvatar && this._renderDefaultAvatar() }
            </Fragment>
        );
    }
}
