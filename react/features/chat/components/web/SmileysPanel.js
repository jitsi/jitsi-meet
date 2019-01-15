// @flow

import React, { PureComponent } from 'react';
import Emoji from 'react-emoji-render';
import { smileys } from '../../smileys';

/**
 * The type of the React {@code Component} props of {@link SmileysPanel}.
 */
type Props = {

    /**
     * Callback to invoke when a smiley is selected. The smiley will be passed
     * back.
     */
    onSmileySelect: Function
};

/**
 * Implements a React Component showing smileys that can be be shown in chat.
 *
 * @extends Component
 */
class SmileysPanel extends PureComponent<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const smileyItems = Object.keys(smileys).map(smileyKey => {
            const onSelectFunction = this._getOnSmileySelectCallback(smileyKey);

            return (
                <div
                    className = 'smileyContainer'
                    id = { smileyKey }
                    key = { smileyKey }>
                    <Emoji
                        onClick = { onSelectFunction }
                        onlyEmojiClassName = 'smiley'
                        text = { smileys[smileyKey] } />
                </div>
            );
        });

        return (
            <div id = 'smileysContainer'>
                { smileyItems }
            </div>
        );
    }

    /**
     * Helper method to bind a smiley's click handler.
     *
     * @param {string} smileyKey - The key from the {@link smileys} object
     * that should be added to the chat message.
     * @private
     * @returns {Function}
     */
    _getOnSmileySelectCallback(smileyKey) {
        return () => this.props.onSmileySelect(smileys[smileyKey]);
    }
}

export default SmileysPanel;
