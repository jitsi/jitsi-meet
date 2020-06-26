/* eslint-disable no-unused-vars */
/* global config */

import { MiddlewareRegistry } from '../redux';

// import { updateSettings } from '../settings';
// import jitsiLocalStorage from '../../../../modules/util/JitsiLocalStorage';
// import { toJid } from '../connection';

import { SET_CURRENT_USER } from './actionTypes';


MiddlewareRegistry.register(store => next => action => {
    const { dispatch } = store;
    const result = next(action);

    switch (action.type) {
    case SET_CURRENT_USER: {
        // const { user } = action;

        // if (user) {
        //     dispatch(updateSettings({
        //         displayName: user.name,
        //         email: user.email
        //     }));
        //     jitsiLocalStorage.setItem('xmpp_username_override', toJid(user.username, config.hosts));
        //     jitsiLocalStorage.setItem('xmpp_password_override', user.id);
        // } else {
        //     dispatch(updateSettings({
        //         displayName: '',
        //         email: ''
        //     }));
        //     jitsiLocalStorage.removeItem('xmpp_username_override');
        //     jitsiLocalStorage.removeItem('xmpp_password_override');
        //     jitsiLocalStorage.removeItem('sessionId');
        // }
        break;
    }
    }

    return result;
});
