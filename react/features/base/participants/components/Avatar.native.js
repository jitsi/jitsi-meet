import React, { Component } from 'react';
import { Image } from 'react-native';

/**
 * Display a participant avatar.
 */
export default class Avatar extends Component {
    /**
     * Avatar component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The optional style to add to an Avatar in order to customize its base
         * look (and feel).
         */
        style: React.PropTypes.object,
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
        // uri
        const prevURI = this.props && this.props.uri;
        const nextURI = nextProps && nextProps.uri;
        let nextState;

        if (prevURI !== nextURI || !this.state) {
            nextState = {
                ...nextState,

                /**
                 * The source of the {@link Image} which is the actual
                 * representation of this {@link Avatar}. As {@code Avatar}
                 * accepts a single URI and {@code Image} deals with a set of
                 * possibly multiple URIs, the state {@code source} was
                 * explicitly introduced in order to reduce unnecessary renders.
                 *
                 * @type {{
                 *     uri: string
                 * }}
                 */
                source: {
                    uri: nextURI
                }
            };
        }

        if (nextState) {
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
        return (
            <Image

                // XXX Avatar is expected to display the whole image.
                resizeMode = 'contain'
                source = { this.state.source }
                style = { this.props.style } />
        );
    }
}
