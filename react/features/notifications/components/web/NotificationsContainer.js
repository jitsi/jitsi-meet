// @flow

import Portal from '@atlaskit/portal';
import React from 'react';
import { Transition, TransitionGroup } from 'react-transition-group';

import { connect } from '../../../base/redux';
import AbstractNotificationsContainer, {
    _abstractMapStateToProps,
    type Props as AbstractProps
} from '../AbstractNotificationsContainer';

import Notification from './Notification';

type Props = AbstractProps & {

    /**
     * Whther we are a SIP gateway or not.
     */
     _iAmSipGateway: boolean
};

/**
 * Implements a React {@link Component} which displays notifications and handles
 * automatic dismissmal after a notification is shown for a defined timeout
 * period.
 *
 * @extends {Component}
 */
class NotificationsContainer extends AbstractNotificationsContainer<Props> {
    /**
     * Creates new NotificationContainer instance.
     *
     * @param {Props} props - The props of the react component.
     */
    constructor(props: Props) {
        super(props);

        this._renderNotification = this._renderNotification.bind(this);
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
            <Portal zIndex = { 600 }>
                <div className = 'notificationsContainer'>
                    { this._renderTopNotificationsContainer() }
                    { this._renderBottomNotificationsContainer() }
                </div>
            </Portal>
        );
    }

    _onDismissed: number => void;

    /**
     * Renders the bottom notification container.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderBottomNotificationsContainer() {
        const { _notifications } = this.props;

        return (
            <TransitionGroup className = 'bottomContainer'>
                {
                    _notifications.filter(n => n.props.position !== 'top').map((notification, index) => {
                        const { props, uid } = notification;

                        return this._renderNotification({
                            ...props,
                            isDismissAllowed: index > 0 ? false : props.isDismissAllowed
                        }, uid);
                    })
                }
            </TransitionGroup>
        );
    }

    _renderNotification: (string, number) => Function;

    /**
     * Renders a notification.
     *
     * @param {Object} props - The props for the Notification component.
     * @param {string} uid - A unique ID for the notification.
     * @returns {Function} - Returns a transition function for the Transition component.
     */
    _renderNotification(props, uid) {
        return (
            <Transition
                key = { uid }
                timeout = { 400 }>
                {
                    transitionState => (
                        <div className = { `notification ${transitionState}` }>
                            <Notification
                                { ...props }
                                id = { uid }
                                key = { uid }
                                onDismissed = { this._onDismissed }
                                uid = { uid } />
                        </div>
                    )
                }
            </Transition>
        );
    }

    /**
     * Renders the top notifications container.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderTopNotificationsContainer() {
        const { _notifications } = this.props;

        return (
            <TransitionGroup className = 'topContainer'>
                {
                    _notifications.filter(n => n.props.position === 'top').map(notification => {
                        const { props, uid } = notification;

                        return this._renderNotification(props, uid);
                    })
                }
            </TransitionGroup>
        );
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
    const { iAmSipGateway } = state['features/base/config'];

    return {
        ..._abstractMapStateToProps(state),
        _iAmSipGateway: Boolean(iAmSipGateway)
    };
}


export default connect(_mapStateToProps)(NotificationsContainer);
