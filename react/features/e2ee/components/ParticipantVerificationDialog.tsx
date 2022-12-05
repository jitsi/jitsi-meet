import React, { Component } from 'react';

import { IState, IStore } from '../../app/types';
import { getParticipantById } from '../../base/participants';
import { connect } from '../../base/redux/functions';
import Dialog from '../../base/ui/components/web/Dialog';
import { participantVerified } from '../actions';


interface IProps {
    decimal: string;
    dispatch: IStore['dispatch'];
    emoji: string;
    pId: string;
    participant: object;
    sas: object;
}

/**
 * Class for the dialog displayed for E2EE sas verification.
 */
export class ParticipantVerificationDialog extends Component<IProps> {
    /**
     * Instantiates a new instance.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this._onConfirmed = this._onConfirmed.bind(this);
        this._onDismissed = this._onDismissed.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { emoji } = this.props.sas;
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

    /**
     * Notifies this ParticipantVerificationDialog that it has been dismissed by cancel.
     *
     * @private
     * @returns {void}
     */
    _onDismissed() {
        this.props.dispatch(participantVerified(this.props.pId, false));

        return true;
    }

    /**
     * Notifies this ParticipantVerificationDialog that it has been dismissed with confirmation.
     *
     * @private
     * @returns {void}
     */
    _onConfirmed() {
        this.props.dispatch(participantVerified(this.props.pId, true));

        return true;
    }
}

/**
 * Maps part of the Redux store to the props of this component.
 *
 * @param {IState} state - The Redux state.
 * @param {IProps} ownProps - The own props of the component.
 * @returns {IProps}
 */
export function _mapStateToProps(state: IState, ownProps: IProps) {
    const participant = getParticipantById(state, ownProps.pId);

    return {
        sas: ownProps.sas,
        pId: ownProps.pId,
        participant
    };
}

export default connect(_mapStateToProps)(ParticipantVerificationDialog);
