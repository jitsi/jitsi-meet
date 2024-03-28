import React, { PureComponent, RefObject } from 'react';
import Emoji from 'react-emoji-render';

import { smileys } from '../../smileys';

/**
 * The type of the React {@code Component} props of {@link SmileysPanel}.
 */
interface IProps {

    /**
     * Callback to invoke to close the smiley panel.
     *
     * @returns {void}
     */
    closeSmileysPanel: Function;

    /**
     * Ref to input icon.
     */
    inputIconRef?: RefObject<any>;

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
    private _wrapperRef: RefObject<HTMLDivElement>;

    /**
     * Initializes a new {@code SmileysPanel} instance.
     *
     * @param {*} props - The read-only properties with which the new instance
     * is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        this._wrapperRef = React.createRef();

        // Bind event handler so it is only bound once for every instance.
        this._onClick = this._onClick.bind(this);
        this._onKeyPress = this._onKeyPress.bind(this);
        this._onEscKey = this._onEscKey.bind(this);
        this._onClickOutside = this._onClickOutside.bind(this);
    }

    /**
     * Component lifecycle method that is called after the component has been mounted.
     * Adds an event listener for the "mousedown" event on the document, which triggers the
     * _onClickOutside method when a click event occurs outside of the component.
     *
     * @returns {void} This function does not return anything.
     */
    componentDidMount() {
        document.addEventListener('mousedown', this._onClickOutside);
    }

    /**
     * Component lifecycle method that is called after the component has been unmounted.
     * Removes the event listener for the "mousedown" event on the document.
     *
     * @returns {void} This function does not return anything.
     */
    componentWillUnmount() {
        document.removeEventListener('mousedown', this._onClickOutside);
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
        if (e.key === ' ') {
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
     * Handles the click event outside of the component.
     *
     * @param {MouseEvent} e - The click event.
     *
     * @returns {void}
     */
    _onClickOutside(e: MouseEvent) {
        const inputIconNotClicked = this.props.inputIconRef?.current
        && !this.props.inputIconRef?.current?.contains(e.target as Node);

        if (inputIconNotClicked) {
            if (this._wrapperRef.current && !this._wrapperRef.current.contains(e.target as Node)) {
                this.props.closeSmileysPanel();
            }
        }
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
                    text = { smileys[smileyKey as keyof typeof smileys] } />
            </div>
        ));

        return (
            <div
                aria-orientation = 'horizontal'
                id = 'smileysContainer'
                onKeyDown = { this._onEscKey }
                ref = { this._wrapperRef }
                role = 'listbox'
                tabIndex = { -1 }>
                { smileyItems }
            </div>
        );
    }
}

export default SmileysPanel;
