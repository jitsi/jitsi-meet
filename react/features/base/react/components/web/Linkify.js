// @flow

import punycode from 'punycode';
import React, { Component } from 'react';
import ReactLinkify from 'react-linkify';
import { LinkPreview } from '@dhaiwat10/react-link-preview';

type Props = {

    /**
     * The children of the component.
     */
    children: React$Node
};

/**
 * Implements a react wrapper for the react-linkify component.
 */
export default class Linkify extends Component<Props> {
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
            <>
            <LinkPreview
                url={decoratedHref}
                height={200}
                width={200}
                showLoader={true}
                openInNewTab={true}
                imageHeight={100}
                descriptionLength={15}
                textAlign="center"
                borderRadius={5}
                fallback={(value) => {
                    return(
                        <p>{value}</p>
                    )
                }}
                secondaryTextColor="SteelBlue"
            />
            <p>
                {
                    decoratedText.split(" ").map((word) => {
                        return word.includes("://") ?
                        (<a href={word}></a>) :
                        (<span>{word}</span>)
                    })
                }
            </p>
            </>
        );
    }
}
