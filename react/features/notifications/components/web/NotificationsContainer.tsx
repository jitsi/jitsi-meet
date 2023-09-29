import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState, IStore } from '../../../app/types';
import { hideNotification } from '../../actions';
import { areThereNotifications } from '../../functions';
import { INotificationProps } from '../../types';
import NotificationsTransition from '../NotificationsTransition';

import Notification from './Notification';
interface IProps {

    /**
     * Whether we are a SIP gateway or not.
     */
    _iAmSipGateway: boolean;

    /**
     * Whether or not the chat is open.
     */
    _isChatOpen: boolean;

    /**
     * The notifications to be displayed, with the first index being the
     * notification at the top and the rest shown below it in order.
     */
    _notifications: Array<{
        props: INotificationProps;
        uid: string;
    }>;

    /**
     * Invoked to update the redux store in order to remove notifications.
     */
    dispatch: IStore['dispatch'];

    /**
     * Whether or not the notifications are displayed in a portal.
     */
    portal?: boolean;
}

const useStyles = makeStyles()(() => {
    return {
        container: {
            position: 'absolute',
            left: '16px',
            bottom: '84px',
            width: '320px',
            maxWidth: '100%',
            zIndex: 600
        },

        containerPortal: {
            width: '100%',
            maxWidth: 'calc(100% - 32px)'
        }
    };
});

const NotificationsContainer = ({
    _iAmSipGateway,
    _notifications,
    dispatch,
    portal
}: IProps) => {
    const { classes, cx } = useStyles();

    const _onDismissed = useCallback((uid: string) => {
        dispatch(hideNotification(uid));
    }, []);

    if (_iAmSipGateway) {
        return null;
    }

    return (
        <div
            className = { cx(classes.container, {
                [classes.containerPortal]: portal
            }) }
            id = 'notifications-container'>
            <NotificationsTransition>
                {_notifications.map(({ props, uid }) => (
                    <Notification
                        { ...props }
                        key = { uid }
                        onDismissed = { _onDismissed }
                        uid = { uid } />
                )) || null}
            </NotificationsTransition>
        </div>
    );
};

/**
 * Maps (parts of) the Redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    const { notifications } = state['features/notifications'];
    const { iAmSipGateway } = state['features/base/config'];
    const { isOpen: isChatOpen } = state['features/chat'];
    const _visible = areThereNotifications(state);

    return {
        _iAmSipGateway: Boolean(iAmSipGateway),
        _isChatOpen: isChatOpen,
        _notifications: _visible ? notifications : []
    };
}

export default connect(_mapStateToProps)(NotificationsContainer);
