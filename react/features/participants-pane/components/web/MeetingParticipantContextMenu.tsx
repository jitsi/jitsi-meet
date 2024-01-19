import React, { Component } from 'react';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import {
    getLocalParticipant,
    getParticipantByIdOrUndefined
} from '../../../base/participants/functions';
import { IParticipant } from '../../../base/participants/types';
import FakeParticipantContextMenu from '../../../video-menu/components/web/FakeParticipantContextMenu';
import ParticipantContextMenu from '../../../video-menu/components/web/ParticipantContextMenu';

interface IProps {

    /**
     * Shared video local participant owner.
     */
    _localVideoOwner: boolean;

    /**
     * Participant reference.
     */
    _participant?: IParticipant;

    /**
     * Closes a drawer if open.
     */
    closeDrawer: () => void;

    /**
     * The dispatch function from redux.
     */
    dispatch: IStore['dispatch'];

    /**
     * The participant for which the drawer is open.
     * It contains the displayName & participantID.
     */
    drawerParticipant: {
        displayName: string;
        participantID: string;
    };

    /**
     * Target elements against which positioning calculations are made.
     */
    offsetTarget?: HTMLElement;

    /**
     * Callback for the mouse entering the component.
     */
    onEnter: (e?: React.MouseEvent) => void;

    /**
     * Callback for the mouse leaving the component.
     */
    onLeave: (e?: React.MouseEvent) => void;

    /**
     * Callback for making a selection in the menu.
     */
    onSelect: (e?: React.MouseEvent | boolean) => void;

    /**
     * The ID of the participant.
     */
    participantID: string;
}

/**
 * Implements the MeetingParticipantContextMenu component.
 */
class MeetingParticipantContextMenu extends Component<IProps> {

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

        const props = {
            closeDrawer,
            drawerParticipant,
            offsetTarget,
            onEnter,
            onLeave,
            onSelect,
            participant: _participant,
            thumbnailMenu: false
        };

        if (_participant?.fakeParticipant) {
            return (
                <FakeParticipantContextMenu
                    { ...props }
                    localVideoOwner = { _localVideoOwner } />
            );
        }

        return <ParticipantContextMenu { ...props } />;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState, ownProps: any) {
    const { participantID, overflowDrawer, drawerParticipant } = ownProps;
    const { ownerId } = state['features/shared-video'];
    const localParticipantId = getLocalParticipant(state)?.id;

    const participant = getParticipantByIdOrUndefined(state,
        overflowDrawer ? drawerParticipant?.participantID : participantID);

    return {
        _localVideoOwner: Boolean(ownerId === localParticipantId),
        _participant: participant
    };
}

export default translate(connect(_mapStateToProps)(MeetingParticipantContextMenu));
