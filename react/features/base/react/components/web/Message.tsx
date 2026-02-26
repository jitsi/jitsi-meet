import React, { Component } from 'react';
import { connect } from 'react-redux';

import { IReduxState } from '../../../../app/types';
import GifMessage from '../../../../chat/components/web/GifMessage';
import MarkdownMessage from '../../../../chat/components/web/MarkdownMessage';
import { extractGifURL, isGifEnabled, isGifMessage } from '../../../../gifs/functions.web';

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
     * Implements React's {@link Component#render()}.
     *
     * @returns {ReactElement}
     */
    override render() {
        const { gifEnabled, screenReaderHelpText, text } = this.props;

        if (gifEnabled && isGifMessage(text)) {
            const url = extractGifURL(text);

            return (
                <p>
                    { screenReaderHelpText && (
                        <span className = 'sr-only'>
                            { screenReaderHelpText }
                        </span>
                    ) }
                    <GifMessage
                        key = { url }
                        url = { url } />
                </p>
            );
        }

        return (
            <MarkdownMessage
                screenReaderHelpText = { screenReaderHelpText }
                text = { text } />
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
