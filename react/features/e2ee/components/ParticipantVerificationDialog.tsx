import React, { Component } from 'react';

import { IState, IStore } from "../../app/types";
import { getParticipantById } from '../../base/participants';
import { connect } from '../../base/redux/functions';
import Dialog from '../../base/ui/components/web/Dialog';
import { participantVerified } from '../actions';


interface Props {
    dispatch: IStore['dispatch'];
    sas: object;
    pId: string;
    participant: object,
    decimal: string;
    emoji: string;
}

/**
 * Class for the dialog displayed for E2EE sas verification.
 */
export class ParticipantVerificationDialog extends Component<Props> {
    /**
     * Instantiates a new instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onConfirmed = this._onConfirmed.bind(this);
        this._onDismissed = this._onDismissed.bind(this);
    }

    render() {
        const { emoji } =  this.props.sas
        const participantName = this.props.participant.name;
        return (
            <Dialog
                cancel = {{ translationKey: 'dialog.verifyParticipantDismiss' }}
                ok = {{ translationKey: 'dialog.verifyParticipantConfirm' }}
                onCancel = { this._onDismissed }
                onSubmit = { this._onConfirmed }
                titleKey = 'dialog.verifyParticipantTitle'>
                <div>
                    { participantName }
                </div>
                <div>
                    { emoji }
                </div>
            </Dialog>
        );
    }

    _onDismissed() {
        this.props.dispatch(participantVerified(false, this.props.pId));
        return true;
    }
    
    _onConfirmed() {
        this.props.dispatch(participantVerified(true, this.props.pId));
        return true;
    }
}

/**
 * Maps part of the Redux store to the props of this component.
 *
 * @param {IState} state - The Redux state.
 * @param {Props} ownProps - The own props of the component.
 * @returns {Props}
 */
export function _mapStateToProps(state: IState, ownProps: Props) {
    const participant = getParticipantById(state, ownProps.pId);

    console.log("XXX participant", participant);

    return {
        sas: ownProps.sas,
        pId: ownProps.pId,
        participant: participant
    };
}

export default connect(_mapStateToProps)(ParticipantVerificationDialog);
