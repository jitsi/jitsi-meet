import React, { Component } from 'react';

import { IReduxState } from '../../app/types';
import { NotificationsContainer } from '../../notifications/components';
import { shouldDisplayTileView } from '../../video-layout/functions.any';
import { shouldDisplayNotifications } from '../functions';

/**
 * The type of the React {@code Component} props of {@link AbstractLabels}.
 */
export type AbstractProps = {

    /**
     * Set to {@code true} when the notifications are to be displayed.
     *
     * @protected
     * @type {boolean}
     */
    _notificationsVisible: boolean;

    /**
     * Conference room name.
     *
     * @protected
     * @type {string}
     */
    _room: string;

    /**
     * Whether or not the layout should change to support tile view mode.
     *
     * @protected
     * @type {boolean}
     */
    _shouldDisplayTileView: boolean;
};

/**
 * A container to hold video status labels, including recording status and
 * current large video quality.
 *
 * @augments Component
 */
export class AbstractConference<P extends AbstractProps, S>
    extends Component<P, S> {

    /**
     * Renders the {@code LocalRecordingLabel}.
     *
     * @param {Object} props - The properties to be passed to
     * the {@code NotificationsContainer}.
     * @protected
     * @returns {React$Element}
     */
    renderNotificationsContainer(props?: any) {
        if (this.props._notificationsVisible) {
            return (
                React.createElement(NotificationsContainer, props)
            );
        }

        return null;
    }
}

/**
 * Maps (parts of) the redux state to the associated props of the {@link Labels}
 * {@code Component}.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {AbstractProps}
 */
export function abstractMapStateToProps(state: IReduxState) {
    return {
        _notificationsVisible: shouldDisplayNotifications(state),
        _room: state['features/base/conference'].room ?? '',
        _shouldDisplayTileView: shouldDisplayTileView(state)
    };
}
