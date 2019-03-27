// @flow

import React from 'react';
import { View } from 'react-native';

import { connect } from '../../../base/redux';

import AbstractNotificationsContainer, {
    _abstractMapStateToProps,
    type Props as AbstractProps
} from '../AbstractNotificationsContainer';

import Notification from './Notification';
import styles from './styles';

type Props = AbstractProps & {

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
 * @extends {Component}
 */
class NotificationsContainer
    extends AbstractNotificationsContainer<Props> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const { _notifications } = this.props;

        // Currently the native container displays only the topmost notification
        const theNotification
            = _notifications && _notifications.length && _notifications[0];

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

export default connect(_abstractMapStateToProps)(NotificationsContainer);
