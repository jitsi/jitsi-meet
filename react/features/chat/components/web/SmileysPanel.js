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
 * @augments Component
 */
class SmileysPanel extends PureComponent<Props> {
    /**
     * Initializes a new {@code SmileysPanel} instance.
     *
     * @param {*} props - The read-only properties with which the new instance
     * is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onClick = this._onClick.bind(this);
        this._onKeyPress = this._onKeyPress.bind(this);
        this._onEscKey = this._onEscKey.bind(this);
    }

    _onEscKey: (Object) => void;

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onEscKey(e) {
        // Escape handling does not work in onKeyPress
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            this.props.onSmileySelect();
        }
    }

    _onKeyPress: (Object) => void;

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onKeyPress(e) {
        if (e.key === ' ') {
            e.preventDefault();
            this.props.onSmileySelect(e.target.id && smileys[e.target.id]);
        }
    }

    _onClick: (Object) => void;

    /**
     * Click handler for to select emoji.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onClick(e) {
        e.preventDefault();
        this.props.onSmileySelect(e.currentTarget.id && smileys[e.currentTarget.id]);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const smileyItems = Object.keys(smileys).map(smileyKey => (
            <div
                className = 'smileyContainer'
                id = { smileyKey }
                key = { smileyKey }
                onClick = { this._onClick }
                onKeyDown = { this._onEscKey }
                onKeyPress = { this._onKeyPress }
                role = 'option'
                tabIndex = { 0 }>
                <Emoji
                    onlyEmojiClassName = 'smiley'
                    text = { smileys[smileyKey] } />
            </div>
        ));

        return (
            <div
                aria-orientation = 'horizontal'
                id = 'smileysContainer'
                onKeyDown = { this._onEscKey }
                role = 'listbox'
                tabIndex = { -1 }>
                { smileyItems }
            </div>
        );
    }
}

export default SmileysPanel;
