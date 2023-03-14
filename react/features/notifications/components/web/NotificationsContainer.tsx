import { withStyles } from '@mui/styles';
import clsx from 'clsx';
import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { IReduxState } from '../../../app/types';
import { connect } from '../../../base/redux/functions';
import { hideNotification } from '../../actions';
import { areThereNotifications } from '../../functions';
import { INotificationProps } from '../../types';
import NotificationsTransition from '../NotificationsTransition';

import Notification from './Notification';
interface IProps extends WithTranslation {

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
     * JSS classes object.
     */
    classes: any;

    /**
     * Invoked to update the redux store in order to remove notifications.
     */
    dispatch: Function;

    /**
     * Whether or not the notifications are displayed in a portal.
     */
    portal?: boolean;
}

const useStyles = () => {
    return {
        container: {
            position: 'absolute' as const,
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
};

/**
 * Implements a React {@link Component} which displays notifications and handles
 * automatic dismissal after a notification is shown for a defined timeout
 * period.
 *
 * @augments {Component}
 */
class NotificationsContainer extends Component<IProps> {

    /**
     * Initializes a new {@code NotificationsContainer} instance.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onDismissed = this._onDismissed.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _notifications } = this.props;

        if (this.props._iAmSipGateway) {
            return null;
        }

        return (
            <div
                className = { clsx(this.props.classes.container, {
                    [this.props.classes.containerPortal]: this.props.portal
                }) }
                id = 'notifications-container'>
                <NotificationsTransition>
                    {_notifications.map(({ props, uid }) => (
                        <Notification
                            { ...props }
                            key = { uid }
                            onDismissed = { this._onDismissed }
                            uid = { uid } />
                    )) || null }
                </NotificationsTransition>
            </div>
        );
    }

    /**
     * Emits an action to remove the notification from the redux store so it
     * stops displaying.
     *
     * @param {string} uid - The id of the notification to be removed.
     * @private
     * @returns {void}
     */
    _onDismissed(uid: string) {
        this.props.dispatch(hideNotification(uid));
    }
}

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

export default connect(_mapStateToProps)(withStyles(useStyles)(NotificationsContainer));
