// @flow

import React, { useState, useEffect } from 'react';

import { setPassword as setPass } from '../../../base/conference';
import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { isLocalParticipantModerator } from '../../../base/participants';
import { connect } from '../../../base/redux';

import Header from './Header';
import PasswordSection from './PasswordSection';

type Props = {

    /**
     * Whether or not the current user can modify the current password.
     */
    _canEditPassword: boolean,

    /**
     * The JitsiConference for which to display a lock state and change the
     * password.
     */
    _conference: Object,

    /**
     * The value for how the conference is locked (or undefined if not locked)
     * as defined by room-lock constants.
     */
    _locked: string,

    /**
     * The current known password for the JitsiConference.
     */
    _password: string,

    /**
     * The number of digits to be used in the password.
     */
    _passwordNumberOfDigits: ?number,

    /**
     * Action that sets the conference password.
     */
    setPassword: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Component that renders the security options dialog.
 *
 * @returns {React$Element<any>}
 */
function SecurityDialog({
    _canEditPassword,
    _conference,
    _locked,
    _password,
    _passwordNumberOfDigits,
    setPassword,
    t
}: Props) {
    const [ passwordEditEnabled, setPasswordEditEnabled ] = useState(false);

    useEffect(() => {
        if (passwordEditEnabled && _password) {
            setPasswordEditEnabled(false);
        }
    }, [ _password ]);

    return (
        <Dialog
            customHeader = { Header }
            hideCancelButton = { true }
            submitDisabled = { true }
            titleKey = 'security.securityOptions'
            width = { 'small' }>
            <div className = 'security-dialog'>
                { t('security.about') }
                <div className = 'invite-more-dialog separator' />
                <PasswordSection
                    canEditPassword = { _canEditPassword }
                    conference = { _conference }
                    locked = { _locked }
                    password = { _password }
                    passwordEditEnabled = { passwordEditEnabled }
                    passwordNumberOfDigits = { _passwordNumberOfDigits }
                    setPassword = { setPassword }
                    setPasswordEditEnabled = { setPasswordEditEnabled } />
            </div>
        </Dialog>
    );
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code SecurityDialog} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function mapStateToProps(state) {
    const {
        conference,
        locked,
        password
    } = state['features/base/conference'];

    return {
        _canEditPassword: isLocalParticipantModerator(state, state['features/base/config'].lockRoomGuestEnabled),
        _conference: conference,
        _dialIn: state['features/invite'],
        _locked: locked,
        _password: password
    };
}

const mapDispatchToProps = { setPassword: setPass };

export default translate(connect(mapStateToProps, mapDispatchToProps)(SecurityDialog));
