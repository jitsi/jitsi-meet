import React, { Component, ReactNode } from 'react';
import ReactLinkify from 'react-linkify';

import { formatURLText } from '../../functions';

interface IProps {

    /**
     * The children of the component.
     */
    children: ReactNode;
}

/**
 * Implements a react wrapper for the react-linkify component.
 */
export default class Linkify extends Component<IProps> {
    /**
     * Implements {@Component#render}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <ReactLinkify
                componentDecorator = { this._componentDecorator }>
                { this.props.children }
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
            <a
                href = { decoratedHref }
                key = { key }
                rel = 'noopener noreferrer'
                target = '_blank'>
                { formatURLText(decoratedText) }
            </a>
        );
    }
}
