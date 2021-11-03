// @flow

import React, { Component } from 'react';

import {
    getLocalParticipantType,
    getParticipantCount
} from '../../base/participants';
import { getRemoteTracks, isHdQualityEnabled } from '../../base/tracks';
import { NotificationsContainer } from '../../notifications/components';
import HdVideoAlert
    from '../../notifications/components/web/HdVideoAlert';
import { shouldDisplayTileView } from '../../video-layout';
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
    _notificationsVisible: boolean,

    /**
     * Conference room name.
     *
     * @protected
     * @type {string}
     */
    _room: string,

    /**
     * Whether or not the layout should change to support tile view mode.
     *
     * @protected
     * @type {boolean}
     */
    _shouldDisplayTileView: boolean,

    /**
     * Whether or not the hd video feature is enabled.
     *
     * @protected
     * @type {boolean}
     */
    _hdVideoEnabled: boolean,

    /**
     * Whether or not the local participant is a practitioner.
     *
     * @protected
     * @type {boolean}
     */
    _isStaffMember: boolean,

    /**
     * Whether or not the conference has started.
     *
     * @protected
     * @type {boolean}
     */
    _conferenceHasStarted: boolean
};

/**
 * A container to hold video status labels, including recording status and
 * current large video quality.
 *
 * @extends Component
 */
export class AbstractConference<P: AbstractProps, S>
    extends Component<P, S> {

    /**
     * Renders the {@code LocalRecordingLabel}.
     *
     * @param {Object} props - The properties to be passed to
     * the {@code NotificationsContainer}.
     * @protected
     * @returns {React$Element}
     */
    renderNotificationsContainer(props: ?Object) {
        if (this.props._notificationsVisible) {
            return (
                React.createElement(NotificationsContainer, props)
            );
        }

        return null;
    }

    /**
     * Renders the {@code HdVideoAlert}.
     *
     * @protected
     * @returns {React$Element}
     */
    renderHdVideoAlert() {
        if (this.props._hdVideoEnabled
            && this.props._isStaffMember
            && this.props._conferenceHasStarted) {
            return <HdVideoAlert />;
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
export function abstractMapStateToProps(state: Object) {
    const participantCount = getParticipantCount(state);
    const remoteTracks = getRemoteTracks(state['features/base/tracks']);

    return {
        _notificationsVisible: shouldDisplayNotifications(state),
        _room: state['features/base/conference'].room,
        _shouldDisplayTileView: shouldDisplayTileView(state),
        _hdVideoEnabled: isHdQualityEnabled(state),
        _isStaffMember: getLocalParticipantType(state) === 'StaffMember',
        _conferenceHasStarted: participantCount > 1 && remoteTracks.length > 0
    };
}
