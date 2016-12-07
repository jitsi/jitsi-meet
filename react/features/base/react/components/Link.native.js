import React, { Component } from 'react';
import { Linking, Text } from 'react-native';

/**
 * Implements a (hyper)link to a URL in the fashion of the HTML anchor element
 * and its href attribute.
 */
export class Link extends Component {
    /**
     * Link component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The children to be displayed within this Link.
         */
        children: React.PropTypes.node,

        /**
         * Notifies that this Link failed to open the URL associated with it.
         */
        onLinkingOpenURLRejected: React.PropTypes.func,

        /**
         * The CSS style to be applied to this Link for the purposes of display.
         */
        style: React.PropTypes.object,

        /**
         * The URL to be opened when this Link is clicked/pressed.
         */
        url: React.PropTypes.string
    }

    /**
     * Initializes a new Link instance.
     *
     * @param {Object} props - Component properties.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onPress = this._onPress.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <Text
                onPress = { this._onPress }
                style = { this.props.style }>
                {
                    this.props.children
                }
            </Text>
        );
    }

    /**
     * Notifies this instance that Linking failed to open the associated URL.
     *
     * @param {any} reason - The rejection reason.
     * @private
     * @returns {void}
     */
    _onLinkingOpenURLRejected(reason) {
        const onRejected = this.props.onLinkingOpenURLRejected;

        onRejected && onRejected(reason);
    }

    /**
     * Handles press on this Link. Opens the URL associated with this Link.
     *
     * @private
     * @returns {void}
     */
    _onPress() {
        Linking.openURL(this.props.url)
            .catch(reason => this._onLinkingOpenURLRejected(reason));
    }
}
