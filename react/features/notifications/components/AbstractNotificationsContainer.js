// @flow

import { Component } from 'react';

import { getOverlayToRender } from '../../overlay';

import { hideNotification } from '../actions';

export type Props = {

    /**
     * The notifications to be displayed, with the first index being the
     * notification at the top and the rest shown below it in order.
     */
    _notifications: Array<Object>,

    /**
     * Invoked to update the redux store in order to remove notifications.
     */
    dispatch: Function
};

/**
 * Abstract class for {@code NotificationsContainer} component.
 */
export default class AbstractNotificationsContainer<P: Props>
    extends Component<P> {
    /**
     * A timeout id returned by setTimeout.
     */
    _notificationDismissTimeout: ?TimeoutID;

    /**
     * Initializes a new {@code AbstractNotificationsContainer} instance.
     *
     * @inheritdoc
     */
    constructor(props: P) {
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
    componentDidUpdate(prevProps: P) {
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
    _manageDismissTimeout(prevProps: ?P) {
        const { _notifications } = this.props;

        if (_notifications.length) {
            const notification = _notifications[0];
            const previousNotification
                = prevProps && prevProps._notifications.length
                    ? prevProps._notifications[0]
                    : undefined;

            if (notification !== previousNotification) {
                this._clearNotificationDismissTimeout();

                if (notification) {
                    const { timeout, uid } = notification;

                    this._notificationDismissTimeout = setTimeout(() => {
                        // Perform a no-op if a timeout is not specified.
                        if (Number.isInteger(timeout)) {
                            this._onDismissed(uid);
                        }
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
     * returns {void}
     */
    componentWillUnmount() {
        this._clearNotificationDismissTimeout();
    }

    _onDismissed: number => void;

    /**
     * Clears the running notification dismiss timeout, if any.
     *
     * @returns {void}
     */
    _clearNotificationDismissTimeout() {
        this._notificationDismissTimeout
            && clearTimeout(this._notificationDismissTimeout);

        this._notificationDismissTimeout = null;
    }

    /**
     * Emits an action to remove the notification from the redux store so it
     * stops displaying.
     *
     * @param {number} uid - The id of the notification to be removed.
     * @private
     * @returns {void}
     */
    _onDismissed(uid) {
        this._clearNotificationDismissTimeout();

        this.props.dispatch(hideNotification(uid));
    }
}

/**
 * Maps (parts of) the Redux state to the associated NotificationsContainer's
 * props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _notifications: Array
 * }}
 */
export function _abstractMapStateToProps(state: Object) {
    const isAnyOverlayVisible = Boolean(getOverlayToRender(state));
    const { enabled, notifications } = state['features/notifications'];
    const { calleeInfoVisible } = state['features/invite'];

    return {
        _notifications: enabled && !isAnyOverlayVisible && !calleeInfoVisible
            ? notifications : []
    };
}
