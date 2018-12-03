// @flow

import { FlagGroup } from '@atlaskit/flag';
import React from 'react';
import { connect } from 'react-redux';

import AbstractNotificationsContainer, {
    _abstractMapStateToProps as _mapStateToProps,
    type Props
} from './AbstractNotificationsContainer';
import Notification from './Notification';

/**
 * Implements a React {@link Component} which displays notifications and handles
 * automatic dismissmal after a notification is shown for a defined timeout
 * period.
 *
 * @extends {Component}
 */
class NotificationsContainer extends AbstractNotificationsContainer<Props> {

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

    _onDismissed: number => void;

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
                    uid = { uid } />

            );
        });
    }
}

export default connect(_mapStateToProps)(NotificationsContainer);
