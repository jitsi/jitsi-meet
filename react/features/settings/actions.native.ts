import { Linking } from 'react-native';

import { IStore } from '../app/types';
import { isTokenAuthEnabled } from '../authentication/functions';
import { hangup } from '../base/connection/actions.native';
import { openDialog } from '../base/dialog/actions';

import LogoutDialog from './components/native/LogoutDialog';


/**
 * Opens {@code LogoutDialog}.
 *
 * @returns {Function}
 */
export function openLogoutDialog() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { conference } = state['features/base/conference'];

        const config = state['features/base/config'];
        const logoutUrl = config.tokenLogoutUrl;

        dispatch(openDialog(LogoutDialog, {
            onLogout() {
                if (isTokenAuthEnabled(config)) {
                    if (logoutUrl) {
                        Linking.openURL(logoutUrl);
                    }

                    dispatch(hangup(true));
                } else {
                    conference?.room.xmpp.moderator.logout(() => dispatch(hangup(true)));
                }
            }
        }));
    };
}
