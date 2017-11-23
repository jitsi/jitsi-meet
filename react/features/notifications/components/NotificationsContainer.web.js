import { FlagGroup } from '@atlaskit/flag';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { hideNotification } from '../actions';

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
        _notifications: PropTypes.array,

        /**
         * Whether or not notifications should be displayed at all. If not,
         * notifications will be dismissed immediately.
         */
        _showNotifications: PropTypes.bool,

        /**
         * Invoked to update the redux store in order to remove notifications.
         */
        dispatch: PropTypes.func
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
        const { _notifications, _showNotifications } = this.props;

        if (_notifications.length) {
            const notification = _notifications[0];

            if (!_showNotifications) {
                this._onDismissed(notification.uid);
            } else if (this._notificationDismissTimeout) {

                // No-op because there should already be a notification that
                // is waiting for dismissal.
            } else {
                const { timeout, uid } = notification;

                this._notificationDismissTimeout = setTimeout(() => {
                    // Perform a no-op if a timeout is not specified.
                    if (Number.isInteger(timeout)) {
                        this._onDismissed(uid);
                    }
                }, timeout);
            }
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
        return (
            <FlagGroup onDismissed = { this._onDismissed }>
                { this._renderFlags() }
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

    /**
     * Renders notifications to display as ReactElements. An empty array will
     * be returned if notifications are disabled.
     *
     * @private
     * @returns {ReactElement[]}
     */
    _renderFlags() {
        const { _notifications, _showNotifications } = this.props;

        if (!_showNotifications) {
            return [];
        }

        return _notifications.map(notification => {
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
function _mapStateToProps(state) {
    // TODO: Per existing behavior, notifications should not display when an
    // overlay is visible. This logic for checking overlay display can likely be
    // simplified.
    const {
        connectionEstablished,
        haveToReload,
        isMediaPermissionPromptVisible,
        suspendDetected
    } = state['features/overlay'];
    const isAnyOverlayVisible = (connectionEstablished && haveToReload)
        || isMediaPermissionPromptVisible
        || suspendDetected
        || state['features/base/jwt'].calleeInfoVisible;

    const { enabled, notifications } = state['features/notifications'];

    return {
        _notifications: notifications,
        _showNotifications: enabled && !isAnyOverlayVisible
    };
}

export default connect(_mapStateToProps)(NotificationsContainer);
