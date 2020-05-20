// @flow

import React, { useState, useEffect } from 'react';

import { createInviteDialogEvent, sendAnalytics } from '../../../../analytics';
import { getRoomName } from '../../../../base/conference';
import { getInviteURL } from '../../../../base/connection';
import { Dialog } from '../../../../base/dialog';
import { translate } from '../../../../base/i18n';
import { JitsiRecordingConstants } from '../../../../base/lib-jitsi-meet';
import { getLocalParticipant } from '../../../../base/participants';
import { connect } from '../../../../base/redux';
import { getActiveSession } from '../../../../recording';
import { updateDialInNumbers } from '../../../actions';
import { _getDefaultPhoneNumber, getInviteText, isAddPeopleEnabled, isDialOutEnabled } from '../../../functions';

import CopyMeetingLinkSection from './CopyMeetingLinkSection';
import DialInSection from './DialInSection';
import Header from './Header';
import InviteByEmailSection from './InviteByEmailSection';
import InviteContactsSection from './InviteContactsSection';
import LiveStreamSection from './LiveStreamSection';

declare var interfaceConfig: Object;

type Props = {

    /**
     * The name of the current conference. Used as part of inviting users.
     */
    _conferenceName: string,

    /**
     * The object representing the dialIn feature.
     */
    _dialIn: Object,

    /**
     * Whether or not invite should be hidden.
     */
    _hideInviteContacts: boolean,

    /**
     * The current url of the conference to be copied onto the clipboard.
     */
    _inviteUrl: string,

    /**
     * The current known URL for a live stream in progress.
     */
    _liveStreamViewURL: string,

    /**
     * The redux representation of the local participant.
     */
    _localParticipantName: ?string,

    /**
     * The current location url of the conference.
     */
    _locationUrl: Object,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

    /**
     * Method to update the dial in numbers.
     */
    updateNumbers: Function
};

/**
 * Invite More component.
 *
 * @returns {React$Element<any>}
 */
function AddPeopleDialog({
    _conferenceName,
    _dialIn,
    _hideInviteContacts,
    _inviteUrl,
    _liveStreamViewURL,
    _localParticipantName,
    _locationUrl,
    t,
    updateNumbers }: Props) {
    const [ phoneNumber, setPhoneNumber ] = useState(undefined);

    /**
     * Updates the dial-in numbers.
     */
    useEffect(() => {
        if (!_dialIn.numbers) {
            updateNumbers();
        }
    }, []);

    /**
     * Sends analytics events when the dialog opens/closes.
     *
     * @returns {void}
     */
    useEffect(() => {
        sendAnalytics(createInviteDialogEvent(
            'invite.dialog.opened', 'dialog'));

        return () => {
            sendAnalytics(createInviteDialogEvent(
                'invite.dialog.closed', 'dialog'));
        };
    }, []);

    /**
     * Updates the phone number in the state once the dial-in numbers are fetched.
     *
     * @returns {void}
     */
    useEffect(() => {
        if (!phoneNumber && _dialIn && _dialIn.numbers) {
            setPhoneNumber(_getDefaultPhoneNumber(_dialIn.numbers));
        }
    }, [ _dialIn ]);

    const invite = getInviteText({
        _conferenceName,
        _localParticipantName,
        _inviteUrl,
        _locationUrl,
        _dialIn,
        _liveStreamViewURL,
        phoneNumber,
        t
    });
    const inviteSubject = t('addPeople.inviteMoreMailSubject', {
        appName: interfaceConfig.APP_NAME
    });

    return (
        <Dialog
            cancelKey = { 'dialog.close' }
            customHeader = { Header }
            hideCancelButton = { true }
            submitDisabled = { true }
            titleKey = 'addPeople.inviteMorePrompt'
            width = { 'small' }>
            <div className = 'invite-more-dialog'>
                { !_hideInviteContacts && <InviteContactsSection /> }
                <CopyMeetingLinkSection url = { _inviteUrl } />
                <InviteByEmailSection
                    inviteSubject = { inviteSubject }
                    inviteText = { invite } />
                {
                    _liveStreamViewURL
                        && <LiveStreamSection liveStreamViewURL = { _liveStreamViewURL } />
                }
                {
                    _dialIn.numbers
                        && <DialInSection
                            conferenceName = { _conferenceName }
                            dialIn = { _dialIn }
                            locationUrl = { _locationUrl }
                            phoneNumber = { phoneNumber } />
                }
            </div>
        </Dialog>
    );
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code AddPeopleDialog} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function mapStateToProps(state) {
    const localParticipant = getLocalParticipant(state);
    const currentLiveStreamingSession
        = getActiveSession(state, JitsiRecordingConstants.mode.STREAM);
    const { iAmRecorder } = state['features/base/config'];
    const addPeopleEnabled = isAddPeopleEnabled(state);
    const dialOutEnabled = isDialOutEnabled(state);

    return {
        _conferenceName: getRoomName(state),
        _dialIn: state['features/invite'],
        _hideInviteContacts:
            iAmRecorder || (!addPeopleEnabled && !dialOutEnabled),
        _inviteUrl: getInviteURL(state),
        _liveStreamViewURL:
            currentLiveStreamingSession
                && currentLiveStreamingSession.liveStreamViewURL,
        _localParticipantName: localParticipant?.name,
        _locationUrl: state['features/base/connection'].locationURL
    };
}

/**
 * Maps dispatching of some action to React component props.
 *
 * @param {Function} dispatch - Redux action dispatcher.
 * @returns {Props}
 */
const mapDispatchToProps = {
    updateNumbers: () => updateDialInNumbers()
};

export default translate(
    connect(mapStateToProps, mapDispatchToProps)(AddPeopleDialog)
);
