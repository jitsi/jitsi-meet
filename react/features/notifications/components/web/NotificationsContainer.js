// @flow

import { FlagGroupContext } from '@atlaskit/flag/flag-group';
import { AtlasKitThemeProvider } from '@atlaskit/theme';
import React, { Component } from 'react';

import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import { hideNotification } from '../../actions';
import { areThereNotifications } from '../../functions';

import Notification from './Notification';
import { Container } from './styled';

declare var interfaceConfig: Object;

type Props = {

    /**
     * Whether we are a SIP gateway or not.
     */
    _iAmSipGateway: boolean,

    /**
     * The notifications to be displayed, with the first index being the
     * notification at the top and the rest shown below it in order.
     */
    _notifications: Array<Object>,

    /**
     * The length, in milliseconds, to use as a default timeout for all
     * dismissible timeouts that do not have a timeout specified.
     */
    autoDismissTimeout: number,

    /**
     * Invoked to update the redux store in order to remove notifications.
     */
    dispatch: Function,

     /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Implements a React {@link Component} which displays notifications and handles
 * automatic dismissal after a notification is shown for a defined timeout
 * period.
 *
 * @extends {Component}
 */
class NotificationsContainer extends Component<Props> {
    _api: Object;
    _timeouts: Map<string, TimeoutID>;

    /**
     * Initializes a new {@code NotificationsContainer} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        // HACK ALERT! We are rendering AtlasKit Flag elements outside of a FlagGroup container.
        // In order to hook-up the dismiss action we'll a fake context provider,
        // just like FlagGroup does.
        this._api = {
            onDismissed: this._onDismissed,
            dismissAllowed: () => true
        };

        this._timeouts = new Map();

        // Bind event handlers so they are only bound once for every instance.
        this._onDismissed = this._onDismissed.bind(this);
    }

    /**
     * Sets a timeout for each notification, where applicable.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this._updateTimeouts();
    }

    /**
     * Sets a timeout for each notification, where applicable.
     *
     * @inheritdoc
     */
    componentDidUpdate() {
        this._updateTimeouts();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        if (this.props._iAmSipGateway) {
            return null;
        }

        return (
            <AtlasKitThemeProvider mode = 'light'>
                <FlagGroupContext.Provider value = { this._api }>
                    <Container id = 'notifications-container'>
                        { this._renderFlags() }
                    </Container>
                </FlagGroupContext.Provider>
            </AtlasKitThemeProvider>
        );
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
        const timeout = this._timeouts.get(uid);

        if (timeout) {
            clearTimeout(timeout);
            this._timeouts.delete(uid);
        }

        this.props.dispatch(hideNotification(uid));
    }

    /**
     * Renders notifications to display as ReactElements. An empty array will
     * be returned if notifications are disabled.
     *
     * @private
     * @returns {ReactElement[]}
     */
    _renderFlags() {
        const { _notifications } = this.props;

        return _notifications.map(notification => {
            const { props, uid } = notification;

            // The id attribute is necessary as {@code FlagGroup} looks for
            // either id or key to set a key on notifications, but accessing
            // props.key will cause React to print an error.
            return (
                <Notification
                    { ...props }
                    id = { uid }
                    key = { uid }
                    onDismissed = { this._onDismissed }
                    uid = { uid } />
            );
        });
    }

    /**
     * Updates the timeouts for every notification.
     *
     * @returns {void}
     */
    _updateTimeouts() {
        const { _notifications, autoDismissTimeout } = this.props;

        for (const notification of _notifications) {
            if ((notification.timeout || typeof autoDismissTimeout === 'number')
                    && notification.props.isDismissAllowed !== false
                    && !this._timeouts.has(notification.uid)) {
                const {
                    timeout = autoDismissTimeout,
                    uid
                } = notification;
                const timerID = setTimeout(() => {
                    this._onDismissed(uid);
                }, timeout);

                this._timeouts.set(uid, timerID);
            }
        }
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const { notifications } = state['features/notifications'];
    const { iAmSipGateway } = state['features/base/config'];
    const _visible = areThereNotifications(state);

    return {
        _iAmSipGateway: Boolean(iAmSipGateway),
        _notifications: _visible ? notifications : [],
        autoDismissTimeout: interfaceConfig.ENFORCE_NOTIFICATION_AUTO_DISMISS_TIMEOUT
    };
}

export default translate(connect(_mapStateToProps)(NotificationsContainer));
