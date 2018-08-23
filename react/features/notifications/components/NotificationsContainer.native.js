// @flow

import React from 'react';
import { View } from 'react-native';
import { connect } from 'react-redux';

import {
    isNarrowAspectRatio,
    makeAspectRatioAware
} from '../../base/responsive-ui';
import { BoxModel } from '../../base/styles';
import { FILMSTRIP_SIZE, isFilmstripVisible } from '../../filmstrip';
import { HANGUP_BUTTON_SIZE } from '../../toolbox';

import AbstractNotificationsContainer, {
    _abstractMapStateToProps,
    type Props as AbstractProps
} from './AbstractNotificationsContainer';
import Notification from './Notification';
import styles from './styles';

type Props = AbstractProps & {

    /**
     * True if the {@code Filmstrip} is visible, false otherwise.
     */
    _filmstripVisible: boolean,

    /**
     * True if the {@ćode Toolbox} is visible, false otherwise.
     */
    _toolboxVisible: boolean
};

/**
 * The margin of the container to be kept from other components.
 */
const CONTAINER_MARGIN = BoxModel.margin;

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
        const { _notifications } = this.props;

        if (!_notifications || !_notifications.length) {
            return null;
        }

        return (
            <View
                pointerEvents = 'box-none'
                style = { [
                    styles.notificationContainer,
                    this._getContainerStyle()
                ] }>
                {
                    _notifications.map(notification => {
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
            </View>
        );
    }

    /**
     * Generates a style object that is to be used for the notification
     * container.
     *
     * @private
     * @returns {?Object}
     */
    _getContainerStyle() {
        const { _filmstripVisible, _toolboxVisible } = this.props;

        // The filmstrip only affects the position if we're on a narrow view.
        const _narrow = isNarrowAspectRatio(this);

        let bottom = 0;
        let right = 0;

        // The container needs additional distance from bottom when the
        // filmstrip or the toolbox is visible.
        _filmstripVisible && !_narrow && (right += FILMSTRIP_SIZE);
        _filmstripVisible && _narrow && (bottom += FILMSTRIP_SIZE);
        _toolboxVisible && (bottom += HANGUP_BUTTON_SIZE);

        bottom += CONTAINER_MARGIN;

        return {
            bottom,
            right
        };
    }

    _onDismissed: number => void;
}

/**
 * Maps (parts of) the Redux state to the associated NotificationsContainer's
 * props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _filmstripVisible: boolean,
 *     _notifications: Array,
 *     _showNotifications: boolean,
 *     _toolboxVisible: boolean
 * }}
 */
export function _mapStateToProps(state: Object) {
    return {
        ..._abstractMapStateToProps(state),
        _filmstripVisible: isFilmstripVisible(state),
        _toolboxVisible: state['features/toolbox'].visible
    };
}

export default connect(_mapStateToProps)(
    makeAspectRatioAware(NotificationsContainer));
