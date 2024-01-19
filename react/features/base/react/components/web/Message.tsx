import React, { Component, ReactNode } from 'react';
import { toArray } from 'react-emoji-render';

import GifMessage from '../../../../chat/components/web/GifMessage';
import { GIF_PREFIX } from '../../../../gifs/constants';
import { isGifMessage } from '../../../../gifs/functions.web';

import Linkify from './Linkify';

interface IProps {

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
     * Parses and builds the message tokens to include emojis and urls.
     *
     * @returns {Array<string|ReactElement>}
     */
    _processMessage() {
        const { text } = this.props;
        const message: (string | ReactNode)[] = [];

        // Tokenize the text in order to avoid emoji substitution for URLs
        const tokens = text ? text.split(' ') : [];

        const content = [];

        // check if the message is a GIF
        if (isGifMessage(text)) {
            const url = text.substring(GIF_PREFIX.length, text.length - 1);

            content.push(<GifMessage
                key = { url }
                url = { url } />);
        } else {
            for (const token of tokens) {

                if (token.includes('://')) {

                    // Bypass the emojification when urls are involved
                    content.push(token);
                } else {
                    content.push(...toArray(token, { className: 'smiley' }));
                }

                content.push(' ');
            }
        }

        content.forEach((token, index) => {
            if (typeof token === 'string' && token !== ' ') {
                message.push(<Linkify key = { `${token}-${index}` }>{ token }</Linkify>);
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
    render() {
        return (
            <>
                { this._processMessage() }
            </>
        );
    }
}

export default Message;
