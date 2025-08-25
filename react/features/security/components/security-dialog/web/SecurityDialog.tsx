import React from 'react';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../../app/types';
import { getSecurityUiConfig } from '../../../../base/config/functions.any';
import { isLocalParticipantHost } from '../../../../base/participants/functions';
import Dialog from '../../../../base/ui/components/web/Dialog';
import { isInBreakoutRoom } from '../../../../breakout-rooms/functions';
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
    const lobbySupported = useSelector((state: IReduxState) =>
        state['features/base/conference'].conference?.isLobbySupported());
    const e2eeSupported = useSelector((state: IReduxState) => state['features/base/conference'].e2eeSupported);
    const isInBreakout = useSelector(isInBreakoutRoom);
    const disableLobbyPassword = useSelector((state: IReduxState) => getSecurityUiConfig(state)?.disableLobbyPassword)
        || isInBreakout;
    const isHost = useSelector(isLocalParticipantHost);
    const { hideLobbyButton } = useSelector(getSecurityUiConfig);
    const _isLobbyVisible = useSelector(isEnablingLobbyAllowed)
        && lobbySupported && isHost && !isInBreakout && !hideLobbyButton;
    const showE2ee = Boolean(e2eeSupported) && isHost;

    return (
        <Dialog
            cancel = {{ hidden: true }}
            ok = {{ hidden: true }}
            titleKey = 'security.title'>
            <div className = 'security-dialog'>
                {
                    _isLobbyVisible && <LobbySection />
                }
                {
                    !disableLobbyPassword && (
                        <>
                            { _isLobbyVisible && <div className = 'separator-line' /> }
                            <PasswordSection />
                        </>
                    )
                }
                {
                    showE2ee ? <>
                        { (_isLobbyVisible || !disableLobbyPassword) && <div className = 'separator-line' /> }
                        <E2EESection />
                    </> : null
                }

            </div>
        </Dialog>
    );
}
