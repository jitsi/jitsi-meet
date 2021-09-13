/* @flow */

import React, { Component } from 'react';

import { Icon } from '../../../base/icons';

/**
 * The type of the React {@code Component} props of
 * {@link VideoMenuButton}.
 */
type Props = {

    /**
     * Text to display within the component that describes the onClick action.
     */
    buttonText: string,

    /**
     * Additional CSS classes to add to the component.
     */
    displayClass?: string,

    /**
     * The icon that will display within the component.
     */
    icon?: Object,

    /**
     * The id attribute to be added to the component's DOM for retrieval when
     * querying the DOM. Not used directly by the component.
     */
    id: string,

    /**
     * Callback to invoke when the component is clicked.
     */
    onClick: Function,
};

/**
 * React {@code Component} for displaying an action in {@code VideoMenuButton}.
 *
 * @extends {Component}
 */
export default class VideoMenuButton extends Component<Props> {
    /**
     * Initializes a new {@code RemoteVideoMenuButton} instance.
     *
     * @param {*} props - The read-only properties with which the new instance
     * is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onKeyPress = this._onKeyPress.bind(this);
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
        if (this.props.onClick && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            this.props.onClick();
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            buttonText,
            displayClass,
            icon,
            id,
            onClick
        } = this.props;

        const linkClassName = `popupmenu__link ${displayClass || ''}`;

        return (
            <li className = 'popupmenu__item'>
                <a
                    aria-label = { buttonText ? buttonText : 'some thing' }
                    className = { linkClassName }
                    id = { id }
                    onClick = { onClick }
                    onKeyPress = { this._onKeyPress }
                    role = 'button'
                    tabIndex = { 0 }>
                    <span className = 'popupmenu__icon'>
                        { icon && <Icon src = { icon } /> }
                    </span>
                    <span className = 'popupmenu__text'>
                        { buttonText }
                    </span>
                </a>
            </li>
        );
    }
}
