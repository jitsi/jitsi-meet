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
        const { gifEnabled } = this.props;

        // check if the message is a GIF
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
