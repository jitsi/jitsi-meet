import { FlagGroup } from '@atlaskit/flag';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { hideNotification } from '../actions';

/**
 * The duration for which a notification should be displayed before being
 * dismissed automatically.
 *
 * @type {number}
 */
const DEFAULT_NOTIFICATION_TIMEOUT = 2500;

/**
 * Implements a React {@link Component} which displays notifications and handles
 * automatic dismissmal after a notification is shown for a defined timeout
 * period.
 *
 * @extends {Component}
 */
class NotificationsContainer extends Component {
    /**
     * {@code NotificationsContainer} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The notifications to be displayed, with the first index being the
         * notification at the top and the rest shown below it in order.
         */
        _notifications: React.PropTypes.array,

        /**
         * Invoked to update the redux store in order to remove notifications.
         */
        dispatch: React.PropTypes.func
    };

    /**
     * Initializes a new {@code NotificationsContainer} instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
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
     * Sets a timeout if the currently displayed notification has changed.
     *
     * @inheritdoc
     * returns {void}
     */
    componentDidUpdate() {
        const { _notifications } = this.props;

        if (_notifications.length && !this._notificationDismissTimeout) {
            const notification = _notifications[0];
            const { timeout, uid } = notification;

            this._notificationDismissTimeout = setTimeout(() => {
                this._onDismissed(uid);
            }, timeout || DEFAULT_NOTIFICATION_TIMEOUT);
        }
    }

    /**
     * Clear any dismissal timeout that is still active.
     *
     * @inheritdoc
     * returns {void}
     */
    componentWillUnmount() {
        clearTimeout(this._notificationDismissTimeout);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _notifications } = this.props;

        const flags = _notifications.map(notification => {
            const Notification = notification.component;
            const { props, uid } = notification;

            // The id attribute is necessary as {@code FlagGroup} looks for
            // either id or key to set a key on notifications, but accessing
            // props.key will cause React to print an error.
            return (
                <Notification
                    { ...props }
                    id = { uid }
                    key = { uid }
                    uid = { uid } />

            );
        });

        return (
            <FlagGroup onDismissed = { this._onDismissed }>
                { flags }
            </FlagGroup>
        );
    }

    /**
     * Emits an action to remove the notification from the redux store so it
     * stops displaying.
     *
     * @param {number} flagUid - The id of the notification to be removed.
     * @private
     * @returns {void}
     */
    _onDismissed(flagUid) {
        clearTimeout(this._notificationDismissTimeout);
        this._notificationDismissTimeout = null;

        this.props.dispatch(hideNotification(flagUid));
    }
}

/**
 * Maps (parts of) the Redux state to the associated NotificationsContainer's
 * props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _notifications: React.PropTypes.array
 * }}
 */
function _mapStateToProps(state) {
    return {
        _notifications: state['features/notifications']
    };
}

export default connect(_mapStateToProps)(NotificationsContainer);
