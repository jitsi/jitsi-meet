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

        const logoutUrl = state['features/base/config'].tokenLogoutUrl;

        dispatch(openDialog('LogoutDialog', LogoutDialog, {
            onLogout() {
                if (isTokenAuthEnabled(state)) {
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
