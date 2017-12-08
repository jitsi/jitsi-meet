import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';

import {
    REMOTE_VIDEO_MENU_MUTE_CONFIRMED,
    sendAnalyticsEvent
} from '../../analytics';
import { muteRemoteParticipant } from '../../base/participants';

/**
 * A React Component with the contents for a dialog that asks for confirmation
 * from the user before muting a remote participant.
 *
 * @extends Component
 */
class MuteRemoteParticipantDialog extends Component {
    /**
     * {@code MuteRemoteParticipantDialog} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Invoked to send a request for muting the participant with the passed
         * in participantID.
         */
        dispatch: PropTypes.func,

        /**
         * The ID of the participant linked to the onClick callback.
         */
        participantID: PropTypes.string,

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func
    };

    /**
     * Initializes a new {@code MuteRemoteParticipantDialog} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onSubmit = this._onSubmit.bind(this);
        this._renderContent = this._renderContent.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <Dialog
                okTitleKey = 'dialog.muteParticipantButton'
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.muteParticipantTitle'
                width = 'small'>
                { this._renderContent() }
            </Dialog>
        );
    }

    /**
     * Handles the submit button action.
     *
     * @private
     * @returns {void}
     */
    _onSubmit() {
        const { dispatch, participantID } = this.props;

        sendAnalyticsEvent(
            REMOTE_VIDEO_MENU_MUTE_CONFIRMED,
            {
                value: 1,
                label: participantID
            }
        );

        dispatch(muteRemoteParticipant(participantID));

        return true;
    }

    /**
     * Renders the content of the dialog.
     *
     * @private
     * @returns {Component} The React {@code Component} which is the view of the
     * dialog content.
     */
    _renderContent() {
        const { t } = this.props;

        return (
            <div>
                { t('dialog.muteParticipantBody') }
            </div>
        );
    }

}

export default translate(connect()(MuteRemoteParticipantDialog));
