import React from 'react';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../../app/types';
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

/**
 * Component that renders the security options dialog.
 *
 * @returns {React$Element<any>}
 */
export default function SecurityDialog() {
    const e2eeSupported = useSelector((state: IReduxState) => state['features/base/conference'].e2eeSupported);
    const disableLobbyPassword = useSelector((state: IReduxState) => getSecurityUiConfig(state)?.disableLobbyPassword);
    const _isEnablingLobbyAllowed = useSelector(isEnablingLobbyAllowed);
    const isModerator = useSelector(isLocalParticipantModerator);
    const showE2ee = Boolean(e2eeSupported) && isModerator;

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
                    !disableLobbyPassword && (
                        <>
                            { _isEnablingLobbyAllowed && <div className = 'separator-line' /> }
                            <PasswordSection />
                        </>
                    )
                }
                {
                    showE2ee ? <>
                        { (_isEnablingLobbyAllowed || !disableLobbyPassword) && <div className = 'separator-line' /> }
                        <E2EESection />
                    </> : null
                }

            </div>
        </Dialog>
    );
}
