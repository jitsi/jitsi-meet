// @flow
import React, { Component } from 'react';

import { translate } from '../../../base/i18n';
import {
    getLocalParticipant,
    getParticipantByIdOrUndefined
} from '../../../base/participants';
import { connect } from '../../../base/redux';
import ParticipantContextMenu from '../../../video-menu/components/web/ParticipantContextMenu';

type Props = {

    /**
     * Shared video local participant owner.
     */
    _localVideoOwner: boolean,

    /**
     * Participant reference.
     */
    _participant: Object,

    /**
     * Closes a drawer if open.
     */
    closeDrawer: Function,

    /**
     * The dispatch function from redux.
     */
    dispatch: Function,

    /**
     * The participant for which the drawer is open.
     * It contains the displayName & participantID.
     */
    drawerParticipant: Object,

    /**
     * Target elements against which positioning calculations are made.
     */
    offsetTarget?: HTMLElement,

    /**
     * Callback for the mouse entering the component.
     */
    onEnter: Function,

    /**
     * Callback for the mouse leaving the component.
     */
    onLeave: Function,

    /**
     * Callback for making a selection in the menu.
     */
    onSelect: Function,

    /**
     * The ID of the participant.
     */
    participantID: string
};

/**
 * Implements the MeetingParticipantContextMenu component.
 */
class MeetingParticipantContextMenu extends Component<Props> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _localVideoOwner,
            _participant,
            closeDrawer,
            drawerParticipant,
            offsetTarget,
            onEnter,
            onLeave,
            onSelect
        } = this.props;

        if (!_participant) {
            return null;
        }

        return (
            <ParticipantContextMenu
                closeDrawer = { closeDrawer }
                drawerParticipant = { drawerParticipant }
                localVideoOwner = { _localVideoOwner }
                offsetTarget = { offsetTarget }
                onEnter = { onEnter }
                onLeave = { onLeave }
                onSelect = { onSelect }
                participant = { _participant }
                thumbnailMenu = { false } />
        );
    }
}

/**
 * Maps (parts of) the redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state, ownProps): Object {
    const { participantID, overflowDrawer, drawerParticipant } = ownProps;
    const { ownerId } = state['features/shared-video'];
    const localParticipantId = getLocalParticipant(state).id;

    const participant = getParticipantByIdOrUndefined(state,
        overflowDrawer ? drawerParticipant?.participantID : participantID);

    return {
        _localVideoOwner: Boolean(ownerId === localParticipantId),
        _participant: participant
    };
}

export default translate(connect(_mapStateToProps)(MeetingParticipantContextMenu));
