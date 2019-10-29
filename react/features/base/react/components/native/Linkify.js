// @flow

import React, { Component } from 'react';
import { Text } from 'react-native';
import ReactLinkify from 'react-linkify';

import { type StyleType } from '../../../styles';

import Link from './Link';

type Props = {

    /**
     * The children of the component.
     */
    children: React$Node,

    /**
     * The extra styles to be applied to links.
     */
    linkStyle: StyleType
};

/**
 * Implements a react native wrapper for the react-linkify component.
 */
export default class Linkify extends Component<Props> {
    /**
     * Initiates a new {@code Component}.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._componentDecorator = this._componentDecorator.bind(this);
    }

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <ReactLinkify
                componentDecorator = { this._componentDecorator }>
                <Text selectable = { true }>
                    { this.props.children }
                </Text>
            </ReactLinkify>
        );
    }

    _componentDecorator: (string, string, number) => React$Node;

    /**
     * Implements a component decorator for react-linkify.
     *
     * @param {string} decoratedHref - The href src.
     * @param {string} decoratedText - The link text.
     * @param {string} key - The component key.
     * @returns {React$Node}
     */
    _componentDecorator(decoratedHref: string, decoratedText: string, key: number) {
        return (
            <Link
                key = { key }
                style = { this.props.linkStyle }
                url = { decoratedHref }>
                {decoratedText}
            </Link>
        );
    }
}
