// @flow

import React, { Component } from 'react';
import { View } from 'react-native';

import { connect } from '../../../base/redux';
import { hideNotification } from '../../actions';
import { areThereNotifications } from '../../functions';

import Notification from './Notification';
import styles from './styles';

type Props = {

    /**
     * The notifications to be displayed, with the first index being the
     * notification at the top and the rest shown below it in order.
     */
    _notifications: Array<Object>,

    /**
     * Invoked to update the redux store in order to remove notifications.
     */
     dispatch: Function,

    /**
     * Any custom styling applied to the notifications container.
     */
    style: Object
};

/**
 * Implements a React {@link Component} which displays notifications and handles
 * automatic dismissmal after a notification is shown for a defined timeout
 * period.
 *
 * @augments {Component}
 */
class NotificationsContainer extends Component<Props> {

    /**
     * A timeout id returned by setTimeout.
     */
    _notificationDismissTimeout: ?TimeoutID;

    /**
     * Initializes a new {@code NotificationsContainer} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        /**
         * The timeout set for automatically dismissing a displayed
         * notification. This value is set on the instance and not state to
         * avoid additional re-renders.
         *
         * @type {number|null}
         */
        this._notificationDismissTimeout = null;

        // Bind event handlers so they are only bound once for every instance.
        this._onDismissed = this._onDismissed.bind(this);
    }

    /**
     * Sets a timeout for the first notification (if applicable).
     *
     * @inheritdoc
     */
    componentDidMount() {
        // Set the initial dismiss timeout (if any)
        this._manageDismissTimeout();
    }

    /**
     * Sets a timeout if the currently displayed notification has changed.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps: Props) {
        this._manageDismissTimeout(prevProps);
    }

    /**
     * Sets/clears the dismiss timeout for the top notification.
     *
     * @param {P} [prevProps] - The previous properties (if called from
     * {@code componentDidUpdate}).
     * @returns {void}
     * @private
     */
    _manageDismissTimeout(prevProps: ?Props) {
        const { _notifications } = this.props;

        if (_notifications.length) {
            const notification = _notifications[0];
            const previousNotification
                 = prevProps && prevProps._notifications.length
                     ? prevProps._notifications[0]
                     : undefined;

            if (notification !== previousNotification) {
                this._clearNotificationDismissTimeout();

                if (notification && notification.timeout) {
                    const {
                        timeout,
                        uid
                    } = notification;

                    this._notificationDismissTimeout = setTimeout(() => {
                        // Perform a no-op if a timeout is not specified.
                        this._onDismissed(uid);
                    }, timeout);
                }
            }
        } else if (this._notificationDismissTimeout) {
            // Clear timeout when all notifications are cleared (e.g external
            // call to clear them)
            this._clearNotificationDismissTimeout();
        }
    }

    /**
     * Clear any dismissal timeout that is still active.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        this._clearNotificationDismissTimeout();
    }

    /**
     * Clears the running notification dismiss timeout, if any.
     *
     * @returns {void}
     */
    _clearNotificationDismissTimeout() {
        this._notificationDismissTimeout && clearTimeout(this._notificationDismissTimeout);

        this._notificationDismissTimeout = null;
    }

    _onDismissed: number => void;

    /**
     * Emits an action to remove the notification from the redux store so it
     * stops displaying.
     *
     * @param {number} uid - The id of the notification to be removed.
     * @private
     * @returns {void}
     */
    _onDismissed(uid) {
        const { _notifications } = this.props;

        // Clear the timeout only if it's the top notification that's being
        // dismissed (the timeout is set only for the top one).
        if (!_notifications.length || _notifications[0].uid === uid) {
            this._clearNotificationDismissTimeout();
        }

        this.props.dispatch(hideNotification(uid));
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const { _notifications } = this.props;

        // Currently the native container displays only the topmost notification
        const theNotification = _notifications[0];

        if (!theNotification) {
            return null;
        }

        return (
            <View
                pointerEvents = 'box-none'
                style = { [
                    styles.notificationContainer,
                    this.props.style
                ] } >
                <Notification
                    { ...theNotification.props }
                    onDismissed = { this._onDismissed }
                    uid = { theNotification.uid } />
            </View>
        );
    }

    _onDismissed: number => void;
}

/**
 * Maps (parts of) the Redux state to the associated NotificationsContainer's
 * props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
export function mapStateToProps(state: Object) {
    const { notifications } = state['features/notifications'];
    const _visible = areThereNotifications(state);

    return {
        _notifications: _visible ? notifications : []
    };
}

export default connect(mapStateToProps)(NotificationsContainer);
