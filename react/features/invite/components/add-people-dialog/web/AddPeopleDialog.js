// @flow

import React, { useEffect } from 'react';

import { createInviteDialogEvent, sendAnalytics } from '../../../../analytics';
import { getInviteURL } from '../../../../base/connection';
import { Dialog } from '../../../../base/dialog';
import { translate } from '../../../../base/i18n';
import { JitsiRecordingConstants } from '../../../../base/lib-jitsi-meet';
import { connect } from '../../../../base/redux';
import { isVpaasMeeting } from '../../../../billing-counter/functions';
import EmbedMeetingTrigger from '../../../../embed-meeting/components/EmbedMeetingTrigger';
import { getActiveSession } from '../../../../recording';
import { updateDialInNumbers } from '../../../actions';
import {
    _getDefaultPhoneNumber,
    getInviteText,
    isAddPeopleEnabled,
    isDialOutEnabled,
    sharingFeatures,
    isSharingEnabled
} from '../../../functions';

import CopyMeetingLinkSection from './CopyMeetingLinkSection';
import DialInSection from './DialInSection';
import InviteByEmailSection from './InviteByEmailSection';
import InviteContactsSection from './InviteContactsSection';
import LiveStreamSection from './LiveStreamSection';

declare var interfaceConfig: Object;

type Props = {

    /**
     * The object representing the dialIn feature.
     */
    _dialIn: Object,

    /**
     * Whether or not embed meeting should be visible.
     */
    _embedMeetingVisible: boolean,

    /**
     * Whether or not dial in number should be visible.
     */
    _dialInVisible: boolean,

    /**
     * Whether or not url sharing button should be visible.
     */
    _urlSharingVisible: boolean,

    /**
     * Whether or not email sharing features should be visible.
     */
    _emailSharingVisible: boolean,

    /**
     * The meeting invitation text.
     */
    _invitationText: string,

    /**
     * Whether or not invite contacts should be visible.
     */
    _inviteContactsVisible: boolean,

    /**
     * The current url of the conference to be copied onto the clipboard.
     */
    _inviteUrl: string,

    /**
     * The current known URL for a live stream in progress.
     */
    _liveStreamViewURL: string,

    /**
     * The default phone number.
     */
    _phoneNumber: ?string,

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
    _dialIn,
    _embedMeetingVisible,
    _dialInVisible,
    _urlSharingVisible,
    _emailSharingVisible,
    _invitationText,
    _inviteContactsVisible,
    _inviteUrl,
    _liveStreamViewURL,
    _phoneNumber,
    t,
    updateNumbers }: Props) {

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

    const inviteSubject = t('addPeople.inviteMoreMailSubject', {
        appName: interfaceConfig.APP_NAME
    });

    return (
        <Dialog
            cancelKey = { 'dialog.close' }
            hideCancelButton = { true }
            submitDisabled = { true }
            titleKey = 'addPeople.inviteMorePrompt'
            width = { 'small' }>
            <div className = 'invite-more-dialog'>
                { _inviteContactsVisible && <InviteContactsSection /> }
                {_urlSharingVisible ? <CopyMeetingLinkSection url = { _inviteUrl } /> : null}
                {
                    _emailSharingVisible
                        ? <InviteByEmailSection
                            inviteSubject = { inviteSubject }
                            inviteText = { _invitationText } />
                        : null
                }
                { _embedMeetingVisible && <EmbedMeetingTrigger /> }
                <div className = 'invite-more-dialog separator' />
                {
                    _liveStreamViewURL
                        && <LiveStreamSection liveStreamViewURL = { _liveStreamViewURL } />
                }
                {
                    _phoneNumber
                        && _dialInVisible
                        && <DialInSection phoneNumber = { _phoneNumber } />
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
 * @param {Object} ownProps - The properties explicitly passed to the component.
 * @private
 * @returns {Props}
 */
function mapStateToProps(state, ownProps) {
    const currentLiveStreamingSession
        = getActiveSession(state, JitsiRecordingConstants.mode.STREAM);
    const { iAmRecorder } = state['features/base/config'];
    const addPeopleEnabled = isAddPeopleEnabled(state);
    const dialOutEnabled = isDialOutEnabled(state);
    const hideInviteContacts = iAmRecorder || (!addPeopleEnabled && !dialOutEnabled);
    const dialIn = state['features/invite'];
    const phoneNumber = dialIn && dialIn.numbers ? _getDefaultPhoneNumber(dialIn.numbers) : undefined;

    return {
        _dialIn: dialIn,
        _embedMeetingVisible: !isVpaasMeeting(state) && isSharingEnabled(sharingFeatures.embed),
        _dialInVisible: isSharingEnabled(sharingFeatures.dialIn),
        _urlSharingVisible: isSharingEnabled(sharingFeatures.url),
        _emailSharingVisible: isSharingEnabled(sharingFeatures.email),
        _invitationText: getInviteText({ state,
            phoneNumber,
            t: ownProps.t }),
        _inviteContactsVisible: interfaceConfig.ENABLE_DIAL_OUT && !hideInviteContacts,
        _inviteUrl: getInviteURL(state),
        _liveStreamViewURL:
            currentLiveStreamingSession
                && currentLiveStreamingSession.liveStreamViewURL,
        _phoneNumber: phoneNumber
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
