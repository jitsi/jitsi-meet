import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n';
import { getAvatarURL, getParticipants } from '../../base/participants';

import ContactListItem from './ContactListItem';

declare var interfaceConfig: Object;

/**
 * React component for showing a list of current conference participants.
 *
 * @extends Component
 */
class ContactListPanel extends Component {
    /**
     * Default values for {@code ContactListPanel} component's properties.
     *
     * @static
     */
    static propTypes = {
        /**
         * The participants to show in the contact list.
         */
        _participants: PropTypes.array,

        /**
         * Whether or not participant avatars should be displayed.
         */
        _showAvatars: PropTypes.bool,

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const { _participants, t } = this.props;

        return (
            <div className = 'contact-list-panel'>
                <div className = 'title'>
                    { t('contactlist', { count: _participants.length }) }
                </div>
                <ul id = 'contacts'>
                    { this._renderContacts() }
                </ul>
            </div>
        );
    }

    /**
     * Renders React Elements for displaying information about each participant
     * in the contact list.
     *
     * @private
     * @returns {ReactElement[]}
     */
    _renderContacts() {
        return this.props._participants.map(participant => {
            const { id, name } = participant;

            return (
                <ContactListItem
                    avatarURI = { this.props._showAvatars
                        ? getAvatarURL(participant) : null }
                    id = { id }
                    key = { id }
                    name = { name } />
            );
        });
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code ContactListPanel}'s
 * props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _locked: boolean,
 *     _participants: Array
 * }}
 */
function _mapStateToProps(state) {
    return {
        _participants: getParticipants(state),
        _showAvatars: interfaceConfig.SHOW_CONTACTLIST_AVATARS
    };
}

export default translate(connect(_mapStateToProps)(ContactListPanel));
