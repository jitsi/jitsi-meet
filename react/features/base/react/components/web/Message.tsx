import React, { Component, ReactNode } from 'react';
import { toArray } from 'react-emoji-render';
import { connect } from 'react-redux';

import { IReduxState } from '../../../../app/types';
import GifMessage from '../../../../chat/components/web/GifMessage';
import { extractGifURL, isGifEnabled, isGifMessage } from '../../../../gifs/functions.web';

import Linkify from './Linkify';

interface IProps {

    /**
     * Whether the gifs are enabled or not.
     */
    gifEnabled: boolean;

    /**
     * Case-insensitive search query whose matches should be wrapped in <mark>.
     * Left undefined/empty for no highlighting.
     */
    highlightQuery?: string;

    /**
     * Message decoration for screen reader.
     */
    screenReaderHelpText?: string;

    /**
     * The body of the message.
     */
    text: string;
}

/**
 * Renders the content of a chat message.
 */
class Message extends Component<IProps> {
    /**
     * Initializes a new {@code Message} instance.
     *
     * @param {IProps} props - The props of the component.
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handlers so they are only bound once for every instance
        this._processMessage = this._processMessage.bind(this);
    }

    /**
     * Wraps case-insensitive matches of query inside token in <mark>. Intended for plain-text
     * tokens only — callers must skip URL/mention tokens so links stay intact.
     *
     * @param {string} token - The text to search within.
     * @param {string} query - The search query.
     * @returns {Array<string | ReactNode>}
     */
    _highlightMatches(token: string, query: string) {
        const lowerToken = token.toLowerCase();
        const lowerQuery = query.toLowerCase();

        if (!lowerQuery || !lowerToken.includes(lowerQuery)) {
            return [ token ];
        }

        const parts: (string | ReactNode)[] = [];
        let remaining = token;
        let remainingLower = lowerToken;
        let offset = 0;

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const matchIndex = remainingLower.indexOf(lowerQuery);

            if (matchIndex === -1) {
                parts.push(remaining);
                break;
            }

            if (matchIndex > 0) {
                parts.push(remaining.slice(0, matchIndex));
            }

            const matchEnd = matchIndex + lowerQuery.length;

            parts.push(
                <mark key = { `match-${offset}` }>
                    { remaining.slice(matchIndex, matchEnd) }
                </mark>
            );

            remaining = remaining.slice(matchEnd);
            remainingLower = remainingLower.slice(matchEnd);
            offset += matchEnd;
        }

        return parts;
    }

    /**
     * Parses and builds the message tokens to include emojis and urls.
     *
     * @returns {Array<string|ReactElement>}
     */
    _processMessage() {
        const { text, highlightQuery } = this.props;
        const message: (string | ReactNode)[] = [];

        // Tokenize the text in order to avoid emoji substitution for URLs
        const tokens = text ? text.split(' ') : [];
        const content: any[] = [];
        const { gifEnabled } = this.props;

        // Check if the message is a GIF
        if (gifEnabled && isGifMessage(text)) {
            const url = extractGifURL(text);

            content.push(<GifMessage
                key = { url }
                url = { url } />);
        } else {
            for (const token of tokens) {

                if (token.includes('://') || token.startsWith('@')) {

                    // Bypass the emojification when urls or matrix ids are involved
                    content.push(token);
                } else {
                    const emojified = [ ...toArray(token, { className: 'smiley' }) ];

                    content.push(
                        ...emojified.some(item => typeof item === 'string') ? [ token ] : emojified
                    );
                }

                content.push(' ');
            }
        }

        content.forEach((token, index) => {
            if (typeof token === 'string' && token !== ' ') {
                const isLinkOrMention = token.includes('://') || token.startsWith('@');
                const children = (highlightQuery && !isLinkOrMention)
                    ? this._highlightMatches(token, highlightQuery)
                    : token;

                message.push(<Linkify key = { `${token}-${index}` }>{ children }</Linkify>);
            } else {
                message.push(token);
            }
        });

        return message;
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @returns {ReactElement}
     */
    override render() {
        const { screenReaderHelpText } = this.props;

        return (
            <p>
                { screenReaderHelpText && (
                    <span className = 'sr-only'>
                        {screenReaderHelpText}
                    </span>
                ) }

                { this._processMessage() }
            </p>
        );
    }
}

/**
 * Maps part of the redux state to the props of this component.
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    return {
        gifEnabled: isGifEnabled(state)
    };
}

export default connect(_mapStateToProps)(Message);
