import React, { Component } from 'react';
import { Linking } from 'react-native';

import Text from './Text';

/**
 * The type of the React {@code Component} props of {@link Link}.
 */
interface IProps {

    /**
     * The children to be displayed within this Link.
     */
    children: React.ReactNode;

    /**
     * Notifies that this Link failed to open the URL associated with it.
     */
    onLinkingOpenURLRejected?: Function;

    /**
     * The CSS style to be applied to this Link for the purposes of display.
     */
    style?: Object;

    /**
     * The URL to be opened when this Link is clicked/pressed.
     */
    url: string;
}

/**
 * Implements a (hyper)link to a URL in the fashion of the HTML anchor element
 * and its href attribute.
 */
export default class Link extends Component<IProps> {
    /**
     * Initializes a new Link instance.
     *
     * @param {Object} props - Component properties.
     */
    constructor(props: IProps) {
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
    override render() {
        return (
            <Text
                onPress = { this._onPress }
                style = { this.props.style }>
                { this.props.children }
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
    _onLinkingOpenURLRejected(reason: Error) {
        const onRejected = this.props.onLinkingOpenURLRejected;

        onRejected?.(reason);
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
