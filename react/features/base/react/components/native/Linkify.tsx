import React, { Component } from 'react';
import ReactLinkify from 'react-linkify';
import { Text } from 'react-native';

import { StyleType } from '../../../styles/functions.any';
import { formatURLText } from '../../functions';

import Link from './Link';

interface IProps {

    /**
     * The children of the component.
     */
    children: React.ReactNode;

    /**
     * The extra styles to be applied to links.
     */
    linkStyle: StyleType;

    /**
     * The extra styles to be applied to text.
     */
    style?: StyleType;
}

/**
 * Implements a react native wrapper for the react-linkify component.
 */
export default class Linkify extends Component<IProps> {
    /**
     * Initiates a new {@code Component}.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
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
                <Text
                    selectable = { true }
                    style = { this.props.style }>
                    { this.props.children }
                </Text>
            </ReactLinkify>
        );
    }

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
                { formatURLText(decoratedText) }
            </Link>
        );
    }
}
