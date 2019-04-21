// @flow

import React, { Component, Fragment, PureComponent } from 'react';
import { Dimensions, Image, Platform, View } from 'react-native';
import FastImage, {
    type CacheControls,
    type Priorities
} from 'react-native-fast-image';

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

    /**
     * Background color for the locally generated avatar.
     */
    backgroundColor: string,

    /**
     * Error indicator for non-local avatars.
     */
    error: boolean,

    /**
     * Indicates if the non-local avatar was loaded or not.
     */
    loaded: boolean,

    /**
     * Source for the non-local avatar.
     */
    source: {
        uri?: string,
        headers?: Object,
        priority?: Priorities,
        cache?: CacheControls,
    }
};

/**
 * Implements a React Native/mobile {@link Component} wich renders the content
 * of an Avatar.
 */
class AvatarContent extends Component<Props, State> {
    /**
     * Initializes a new Avatar instance.
     *
     * @param {Props} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Set the image source. The logic for the character # below is as
        // follows:
        // - Technically, URI is supposed to start with a scheme and scheme
        //   cannot contain the character #.
        // - Technically, the character # in a URI signals the start of the
        //   fragment/hash.
        // - Technically, the fragment/hash does not imply a retrieval
        //   action.
        // - Practically, the fragment/hash does not always mandate a
        //   retrieval action. For example, an HTML anchor with an href that
        //   starts with the character # does not cause a Web browser to
        //   initiate a retrieval action.
        // So I'll use the character # at the start of URI to not initiate
        // an image retrieval action.
        const source = {};

        if (props.uri && !props.uri.startsWith('#')) {
            source.uri = props.uri;
        }

        this.state = {
            backgroundColor: this._getBackgroundColor(props),
            error: false,
            loaded: false,
            source
        };

        // Bind event handlers so they are only bound once per instance.
        this._onAvatarLoaded = this._onAvatarLoaded.bind(this);
        this._onAvatarLoadError = this._onAvatarLoadError.bind(this);
    }

    /**
     * Computes if the default avatar (ie, locally generated) should be used
     * or not.
     */
    get useDefaultAvatar() {
        const { error, loaded, source } = this.state;

        return !source.uri || error || !loaded;
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
     * Handler called when the remote image loading finishes. This doesn't
     * necessarily mean the load was successful.
     *
     * @private
     * @returns {void}
     */
    _onAvatarLoaded() {
        this.setState({ loaded: true });
    }

    _onAvatarLoadError: () => void;

    /**
     * Handler called when the remote image loading failed.
     *
     * @private
     * @returns {void}
     */
    _onAvatarLoadError() {
        this.setState({ error: true });
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

        const { backgroundColor } = this.state;
        const imageStyle = this._getImageStyle();
        const viewStyle = {
            ...imageStyle,

            backgroundColor,

            // FIXME @lyubomir: Without the opacity below I feel like the
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
        const { source } = this.state;
        let extraStyle;

        if (this.useDefaultAvatar) {
            // On Android, the image loading indicators don't work unless the
            // Glide image is actually created, so we cannot use display: none.
            // Instead, render it off-screen, which does the trick.
            if (Platform.OS === 'android') {
                const windowDimensions = Dimensions.get('window');

                extraStyle = {
                    bottom: -windowDimensions.height,
                    right: -windowDimensions.width
                };
            } else {
                extraStyle = { display: 'none' };
            }
        }

        return (
            <FastImage
                onError = { this._onAvatarLoadError }
                onLoadEnd = { this._onAvatarLoaded }
                resizeMode = 'contain'
                source = { source }
                style = { [ this._getImageStyle(), extraStyle ] } />
        );
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const { source } = this.state;

        return (
            <Fragment>
                { source.uri && this._renderAvatar() }
                { this.useDefaultAvatar && this._renderDefaultAvatar() }
            </Fragment>
        );
    }
}

/* eslint-disable react/no-multi-comp */

/**
 * Implements an avatar as a React Native/mobile {@link Component}.
 *
 * Note: we use `key` in order to trigger a new component creation in case
 * the URI changes.
 */
export default class Avatar extends PureComponent<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <AvatarContent
                key = { this.props.uri }
                { ...this.props } />
        );
    }
}
