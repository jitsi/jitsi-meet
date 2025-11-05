import { AnyAction } from 'redux';
import { hideNotification, showNotification } from '../../../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../../../../notifications/constants';
import { CONNECTION_DISCONNECTED, CONNECTION_ESTABLISHED, CONNECTION_FAILED } from '../../../connection/actionTypes';
import MiddlewareRegistry from '../../../redux/MiddlewareRegistry';

const RECONNECTION_NOTIFICATION_ID = 'connection.reconnecting';

let reconnectionNotificationShown = false;

/**
 * Middleware to show user feedback during connection issues.
 * DOES NOT force disconnect - lets lib-jitsi-meet handle reconnection.
 */
MiddlewareRegistry.register(({ dispatch }) => next => (action: AnyAction) => {
    const result = next(action);

    switch (action.type) {
    case CONNECTION_ESTABLISHED: {
        console.log('Connection established successfully');

        if (reconnectionNotificationShown) {
            dispatch(hideNotification(RECONNECTION_NOTIFICATION_ID));
            dispatch(showNotification({
                titleKey: 'notify.connectedTitle',
                descriptionKey: 'notify.connectedMessage'
            }, NOTIFICATION_TIMEOUT_TYPE.SHORT));
            reconnectionNotificationShown = false;
        }

        break;
    }

    case CONNECTION_FAILED: {
        console.warn('Connection failed, lib-jitsi-meet will attempt reconnection');

        if (!reconnectionNotificationShown) {
            dispatch(showNotification({
                titleKey: 'notify.connectionLost',
                descriptionKey: 'notify.reconnecting',
                uid: RECONNECTION_NOTIFICATION_ID
            }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
            reconnectionNotificationShown = true;
        }

        break;
    }

    case CONNECTION_DISCONNECTED: {

        if (reconnectionNotificationShown) {
            dispatch(hideNotification(RECONNECTION_NOTIFICATION_ID));
            reconnectionNotificationShown = false;
        }
        break;
    }
    }

    return result;
});
