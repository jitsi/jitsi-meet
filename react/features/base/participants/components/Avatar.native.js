import React, { Component } from 'react';
import { CustomCachedImage } from 'react-native-img-cache';

import AvatarImage from './AvatarImage';


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
        style: React.PropTypes.object,

        /**
         * The URI of the {@link Avatar}.
         *
         * @type {string}
         */
        uri: React.PropTypes.string
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
        const prevURI = this.props && this.props.uri;
        const nextURI = nextProps && nextProps.uri;

        if (prevURI !== nextURI || !this.state) {
            const nextState = {
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
                source: {
                    uri: nextURI
                }
            };

            if (this.state) {
                this.setState(nextState);
            } else {
                this.state = nextState;
            }
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        // Propagate all props of this Avatar but the ones consumed by this
        // Avatar to the Image it renders.

        // eslint-disable-next-line no-unused-vars
        const { uri, ...props } = this.props;

        return (
            <CustomCachedImage
                { ...props }
                component = { AvatarImage }
                resizeMode = 'contain'
                source = { this.state.source } />
        );
    }
}
