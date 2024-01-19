import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { Platform } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
import { hideNotification } from '../../actions';
import { areThereNotifications } from '../../functions';
import NotificationsTransition from '../NotificationsTransition';

import Notification from './Notification';
import styles from './styles';


interface IProps extends WithTranslation {

    /**
     * The notifications to be displayed, with the first index being the
     * notification at the top and the rest shown below it in order.
     */
    _notifications: Array<Object>;

    /**
     * Invoked to update the redux store in order to remove notifications.
     */
    dispatch: IStore['dispatch'];

    /**
     * Whether or not the layout should change to support tile view mode.
     */
    shouldDisplayTileView: boolean;

    /**
     * Checks toolbox visibility.
     */
    toolboxVisible: boolean;
}

/**
 * Implements a React {@link Component} which displays notifications and handles
 * automatic dismissal after a notification is shown for a defined timeout
 * period.
 *
 * @augments {Component}
 */
class NotificationsContainer extends Component<IProps> {

    /**
     * A timeout id returned by setTimeout.
     */
    _notificationDismissTimeout: any;

    /**
     * Initializes a new {@code NotificationsContainer} instance.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
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
     * Sets a timeout (if applicable).
     *
     * @inheritdoc
     */
    componentDidMount() {
        // Set the initial dismiss timeout (if any)
        // @ts-ignore
        this._manageDismissTimeout();
    }

    /**
     * Sets a timeout if the currently displayed notification has changed.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps: IProps) {
        this._manageDismissTimeout(prevProps);
    }

    /**
     * Sets/clears the dismiss timeout for the top notification.
     *
     * @param {IProps} [prevProps] - The previous properties (if called from
     * {@code componentDidUpdate}).
     * @returns {void}
     * @private
     */
    _manageDismissTimeout(prevProps: IProps) {
        const { _notifications } = this.props;

        if (_notifications.length) {
            const notification = _notifications[0];
            const previousNotification = prevProps?._notifications.length
                ? prevProps._notifications[0] : undefined;

            if (notification !== previousNotification) {
                this._clearNotificationDismissTimeout();

                // @ts-ignore
                if (notification?.timeout) {

                    // @ts-ignore
                    const { timeout, uid } = notification;

                    // @ts-ignore
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

    /**
     * Emits an action to remove the notification from the redux store so it
     * stops displaying.
     *
     * @param {Object} uid - The id of the notification to be removed.
     * @private
     * @returns {void}
     */
    _onDismissed(uid: any) {
        const { _notifications } = this.props;

        // Clear the timeout only if it's the top notification that's being
        // dismissed (the timeout is set only for the top one).
        // @ts-ignore
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
        const { _notifications, shouldDisplayTileView, toolboxVisible } = this.props;
        let notificationsContainerStyle;

        if (shouldDisplayTileView) {

            if (toolboxVisible) {
                notificationsContainerStyle = styles.withToolboxTileView;
            } else {
                notificationsContainerStyle = styles.withoutToolboxTileView;
            }

        } else {
            notificationsContainerStyle
                = toolboxVisible ? styles.withToolbox : styles.withoutToolbox;
        }

        return (
            <SafeAreaView
                edges = { [ Platform.OS === 'ios' && 'bottom', 'left', 'right' ].filter(Boolean) as Edge[] }
                style = { notificationsContainerStyle as any }>
                <NotificationsTransition>
                    {
                        _notifications.map(notification => {
                            // @ts-ignore
                            const { props, uid } = notification;

                            return (
                                <Notification
                                    { ...props }
                                    key = { uid }
                                    onDismissed = { this._onDismissed }
                                    uid = { uid } />
                            );
                        })
                    }
                </NotificationsTransition>
            </SafeAreaView>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated NotificationsContainer's
 * props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
export function mapStateToProps(state: IReduxState) {
    const { notifications } = state['features/notifications'];
    const _visible = areThereNotifications(state);

    return {
        _notifications: _visible ? notifications : []
    };
}

export default connect(mapStateToProps)(NotificationsContainer);
