import { useSelector } from 'react-redux';

import { IReduxState } from '../app/types';
import { getSecurityUiConfig } from '../base/config/functions.any';
import { LOBBY_MODE_ENABLED, MEETING_PASSWORD_ENABLED, SECURITY_OPTIONS_ENABLED } from '../base/flags/constants';
import { getFeatureFlag } from '../base/flags/functions';
import { isLocalParticipantModerator } from '../base/participants/functions';

import SecurityDialogButton from './components/security-dialog/web/SecurityDialogButton';
import { isSecurityDialogButtonVisible } from './functions';

const security = {
    key: 'security',
    alias: 'info',
    Content: SecurityDialogButton,
    group: 2
};

/**
 * A hook that returns the security dialog button if it is enabled and undefined otherwise.
 *
 *  @returns {Object | undefined}
 */
export function useSecurityDialogButton() {
    const conference = useSelector((state: IReduxState) => state['features/base/conference'].conference);
    const securityUIConfig = useSelector(getSecurityUiConfig);
    const isModerator = useSelector(isLocalParticipantModerator);
    const enabledLobbyModeFlag
        = useSelector((state: IReduxState) => getFeatureFlag(state, LOBBY_MODE_ENABLED, true));
    const enabledSecurityOptionsFlag
        = useSelector((state: IReduxState) => getFeatureFlag(state, SECURITY_OPTIONS_ENABLED, true));
    const enabledMeetingPassFlag
        = useSelector((state: IReduxState) => getFeatureFlag(state, MEETING_PASSWORD_ENABLED, true));

    if (isSecurityDialogButtonVisible({
        conference,
        securityUIConfig,
        isModerator,
        enabledLobbyModeFlag,
        enabledSecurityOptionsFlag,
        enabledMeetingPassFlag
    })) {
        return security;
    }
}
