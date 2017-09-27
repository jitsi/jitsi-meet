/* global APP */

import PropTypes from 'prop-types';
import React, { Component } from 'react';

import UIEvents from '../../../../service/UI/UIEvents';

import { Avatar } from '../../base/participants';

/**
 * Implements a React {@code Component} for showing a participant's avatar and
 * name and emits an event when it has been clicked.
 *
 * @extends Component
 */
class ContactListItem extends Component {
    /**
     * Default values for {@code ContactListItem} component's properties.
     *
     * @static
     */
    static propTypes = {
        /**
         * The link to the participant's avatar image.
         */
        avatarURI: PropTypes.string,

        /**
         * An id attribute to set on the root of {@code ContactListItem}. Used
         * by the torture tests.
         */
        id: PropTypes.string,

        /**
         * The participant's display name.
         */
        name: PropTypes.string
    };

    /**
     * Initializes new {@code ContactListItem} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onClick = this._onClick.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <li
                className = 'clickable contact-list-item'
                id = { this.props.id }
                onClick = { this._onClick }>
                { this.props.avatarURI ? this._renderAvatar() : null }
                <p className = 'contact-list-item-name'>
                    { this.props.name }
                </p>
            </li>
        );
    }

    /**
     * Emits an event notifying the contact list item for the passed in
     * participant ID has been clicked.
     *
     * @private
     * @returns {void}
     */
    _onClick() {
        // FIXME move this call to a pinning action, which is what's happening
        // on the listener end, when the listener is properly hooked into redux.
        APP.UI.emitEvent(UIEvents.CONTACT_CLICKED, this.props.id);
    }

    /**
     * Renders the React Element for displaying the participant's avatar image.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderAvatar() {
        return (
            <Avatar
                className = 'icon-avatar avatar'
                uri = { this.props.avatarURI } />
        );
    }
}

export default ContactListItem;
