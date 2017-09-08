import Button from '@atlaskit/button';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n';
import { getAvatarURL, getParticipants } from '../../base/participants';
import { openInviteDialog } from '../../invite';

import ContactListItem from './ContactListItem';

const { PropTypes } = React;

declare var interfaceConfig: Object;

/**
 * React component for showing a list of current conference participants, the
 * current conference lock state, and a button to open the invite dialog.
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
         * Whether or not the conference is currently locked with a password.
         */
        _locked: PropTypes.bool,

        /**
         * The participants to show in the contact list.
         */
        _participants: PropTypes.array,

        /**
         * Invoked to open an invite dialog.
         */
        dispatch: PropTypes.func,

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func
    };

    /**
     * Initializes a new {@code ContactListPanel} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onOpenInviteDialog = this._onOpenInviteDialog.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const { _locked, _participants, t } = this.props;

        return (
            <div className = 'contact-list-panel'>
                <div className = 'title'>
                    { t('contactlist', { pcount: _participants.length }) }
                </div>
                <div className = 'sideToolbarBlock first'>
                    <Button
                        appearance = 'primary'
                        className = 'contact-list-panel-invite-button'
                        id = 'addParticipantsBtn'
                        onClick = { this._onOpenInviteDialog }
                        type = 'button'>
                        { t('addParticipants') }
                    </Button>
                    <div>
                        { _locked
                            ? this._renderLockedMessage()
                            : this._renderUnlockedMessage() }
                    </div>
                </div>
                <ul id = 'contacts'>
                    { this._renderContacts() }
                </ul>
            </div>
        );
    }

    /**
     * Dispatches an action to open an invite dialog.
     *
     * @private
     * @returns {void}
     */
    _onOpenInviteDialog() {
        this.props.dispatch(openInviteDialog());
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
                    avatarURI = { interfaceConfig.SHOW_CONTACTLIST_AVATARS
                        ? getAvatarURL(participant) : null }
                    id = { id }
                    key = { id }
                    name = { name } />
            );
        });
    }

    /**
     * Renders a React Element for informing the conference is currently locked.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderLockedMessage() {
        return (
            <p
                className = 'form-control__hint form-control_full-width'
                id = 'contactListroomLocked'>
                <span className = 'icon-security-locked' />
                <span>{ this.props.t('roomLocked') }</span>
            </p>
        );
    }

    /**
     * Renders a React Element for informing the conference is currently not
     * locked.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderUnlockedMessage() {
        return (
            <p
                className = 'form-control__hint form-control_full-width'
                id = 'contactListroomUnlocked'>
                <span className = 'icon-security' />
                <span>{ this.props.t('roomUnlocked') }</span>
            </p>
        );
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
        _locked: state['features/base/conference'].locked,
        _participants: getParticipants(state)
    };
}

export default translate(connect(_mapStateToProps)(ContactListPanel));
