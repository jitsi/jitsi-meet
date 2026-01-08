import React, { PureComponent } from 'react';
import Emoji from 'react-emoji-render';

import Tooltip from '../../../base/tooltip/components/Tooltip';
import { smileys } from '../../smileys';

/**
 * The type of the React {@code Component} props of {@link SmileysPanel}.
 */
interface IProps {

    /**
     * Callback to invoke when a smiley is selected. The smiley will be passed
     * back.
     */
    onSmileySelect: Function;
}

/**
 * Implements a React Component showing smileys that can be be shown in chat.
 *
 * @augments Component
 */
class SmileysPanel extends PureComponent<IProps> {
    /**
     * Initializes a new {@code SmileysPanel} instance.
     *
     * @param {*} props - The read-only properties with which the new instance
     * is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onClick = this._onClick.bind(this);
        this._onKeyPress = this._onKeyPress.bind(this);
        this._onEscKey = this._onEscKey.bind(this);
    }

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onEscKey(e: React.KeyboardEvent) {
        // Escape handling does not work in onKeyPress
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            this.props.onSmileySelect();
        }
    }

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onKeyPress(e: React.KeyboardEvent<HTMLDivElement>) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault(); // @ts-ignore
            this.props.onSmileySelect(e.target.id && smileys[e.target.id]);
        }
    }

    /**
     * Click handler for to select emoji.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onClick(e: React.MouseEvent) {
        e.preventDefault();
        this.props.onSmileySelect(e.currentTarget.id && smileys[e.currentTarget.id as keyof typeof smileys]);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
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
                <Tooltip content = { smileys[smileyKey as keyof typeof smileys] }>
                    <Emoji
                        onlyEmojiClassName = 'smiley'
                        text = { smileys[smileyKey as keyof typeof smileys] } />
                </Tooltip>
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
