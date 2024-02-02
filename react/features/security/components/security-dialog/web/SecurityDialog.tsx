import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';

import { IReduxState } from '../../../../app/types';
import { setPassword as setPass } from '../../../../base/conference/actions';
import { IJitsiConference } from '../../../../base/conference/reducer';
import { getSecurityUiConfig } from '../../../../base/config/functions.any';
import { isLocalParticipantModerator } from '../../../../base/participants/functions';
import Dialog from '../../../../base/ui/components/web/Dialog';
import E2EESection from '../../../../e2ee/components/E2EESection';
import LobbySection from '../../../../lobby/components/web/LobbySection';
import { isEnablingLobbyAllowed } from '../../../../lobby/functions';

import PasswordSection from './PasswordSection';

export interface INotifyClick {
    key: string;
    preventExecution: boolean;
}

interface IProps {

    /**
     * Toolbar buttons which have their click exposed through the API.
     */
    _buttonsWithNotifyClick: Array<string | INotifyClick>;

    /**
     * Whether or not the current user can modify the current password.
     */
    _canEditPassword: boolean;

    /**
     * The JitsiConference for which to display a lock state and change the
     * password.
     */
    _conference?: IJitsiConference;

    /**
     * Whether to hide the lobby password section.
     */
    _disableLobbyPassword?: boolean;

    /**
     * Whether to hide the lobby section.
     */
    _isEnablingLobbyAllowed: boolean;

    /**
     * The value for how the conference is locked (or undefined if not locked)
     * as defined by room-lock constants.
     */
    _locked?: string;

    /**
     * The current known password for the JitsiConference.
     */
    _password?: string;

    /**
     * The number of digits to be used in the password.
     */
    _passwordNumberOfDigits?: number;

    /**
     * Indicates whether e2ee will be displayed or not.
     */
    _showE2ee: boolean;

    /**
     * Action that sets the conference password.
     */
    setPassword: Function;
}

/**
 * Component that renders the security options dialog.
 *
 * @returns {React$Element<any>}
 */
function SecurityDialog({
    _buttonsWithNotifyClick,
    _canEditPassword,
    _conference,
    _disableLobbyPassword,
    _isEnablingLobbyAllowed,
    _locked,
    _password,
    _passwordNumberOfDigits,
    _showE2ee,
    setPassword
}: IProps) {
    const [ passwordEditEnabled, setPasswordEditEnabled ] = useState(false);

    useEffect(() => {
        if (passwordEditEnabled && _password) {
            setPasswordEditEnabled(false);
        }
    }, [ _password ]);

    return (
        <Dialog
            cancel = {{ hidden: true }}
            ok = {{ hidden: true }}
            titleKey = 'security.title'>
            <div className = 'security-dialog'>
                {
                    _isEnablingLobbyAllowed && <LobbySection />
                }
                {
                    !_disableLobbyPassword && (
                        <>
                            { _isEnablingLobbyAllowed && <div className = 'separator-line' /> }
                            <PasswordSection
                                buttonsWithNotifyClick = { _buttonsWithNotifyClick }
                                canEditPassword = { _canEditPassword }
                                conference = { _conference }
                                locked = { _locked }
                                password = { _password }
                                passwordEditEnabled = { passwordEditEnabled }
                                passwordNumberOfDigits = { _passwordNumberOfDigits }
                                setPassword = { setPassword }
                                setPasswordEditEnabled = { setPasswordEditEnabled } />
                        </>
                    )
                }
                {
                    _showE2ee ? <>
                        { (_isEnablingLobbyAllowed || !_disableLobbyPassword) && <div className = 'separator-line' /> }
                        <E2EESection />
                    </> : null
                }

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
 * @returns {IProps}
 */
function mapStateToProps(state: IReduxState) {
    const {
        conference,
        e2eeSupported,
        locked,
        password
    } = state['features/base/conference'];
    const {
        roomPasswordNumberOfDigits,
        buttonsWithNotifyClick
    } = state['features/base/config'];
    const { disableLobbyPassword } = getSecurityUiConfig(state);
    const _isEnablingLobbyAllowed = isEnablingLobbyAllowed(state);

    const showE2ee = Boolean(e2eeSupported) && isLocalParticipantModerator(state);

    return {
        _buttonsWithNotifyClick: buttonsWithNotifyClick ?? [],
        _canEditPassword: isLocalParticipantModerator(state),
        _conference: conference,
        _dialIn: state['features/invite'],
        _disableLobbyPassword: disableLobbyPassword,
        _isEnablingLobbyAllowed,
        _locked: locked,
        _password: password,
        _passwordNumberOfDigits: roomPasswordNumberOfDigits,
        _showE2ee: showE2ee
    };
}

const mapDispatchToProps = { setPassword: setPass };

export default connect(mapStateToProps, mapDispatchToProps)(SecurityDialog);
