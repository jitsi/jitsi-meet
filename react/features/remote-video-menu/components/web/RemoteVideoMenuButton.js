/* @flow */

import React, { Component } from 'react';

import { Icon } from '../../../base/icons';

/**
 * The type of the React {@code Component} props of
 * {@link RemoteVideoMenuButton}.
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
    icon: Object,

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
 * React {@code Component} for displaying an action in {@code RemoteVideoMenu}.
 *
 * @extends {Component}
 */
export default class RemoteVideoMenuButton extends Component<Props> {
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
                    className = { linkClassName }
                    id = { id }
                    onClick = { onClick }>
                    <span className = 'popupmenu__icon'>
                        <Icon src = { icon } />
                    </span>
                    <span className = 'popupmenu__text'>
                        { buttonText }
                    </span>
                </a>
            </li>
        );
    }
}
