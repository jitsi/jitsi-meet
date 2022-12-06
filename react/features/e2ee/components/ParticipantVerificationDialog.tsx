import { withStyles } from '@mui/styles';
import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { IReduxState, IStore } from '../../app/types';
import { translate } from '../../base/i18n/functions';
import { getParticipantById } from '../../base/participants/functions';
import { connect } from '../../base/redux/functions';
import Dialog from '../../base/ui/components/web/Dialog';
import { participantVerified } from '../actions';
import { ISas } from '../reducer';

interface IProps extends WithTranslation {
    classes: any;
    decimal: string;
    dispatch: IStore['dispatch'];
    emoji: string;
    pId: string;
    participantName: string;
    sas: ISas;
}

/**
 * Creates the styles for the component.
 *
 * @param {Object} theme - The current UI theme.
 *
 * @returns {Object}
 */
const styles = () => {
    return {
        container: {
            display: 'flex',
            flexDirection: 'column',
            margin: '16px'
        },
        row: {
            alignSelf: 'center',
            display: 'flex'
        },
        item: {
            textAlign: 'center',
            margin: '16px'
        },
        emoji: {
            fontSize: '40px',
            margin: '12px'
        }
    };
};


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
        const { participantName } = this.props;

        const { classes, t } = this.props;

        return (
            <Dialog
                cancel = {{ translationKey: 'dialog.verifyParticipantDismiss' }}
                ok = {{ translationKey: 'dialog.verifyParticipantConfirm' }}
                onCancel = { this._onDismissed }
                onSubmit = { this._onConfirmed }
                titleKey = 'dialog.verifyParticipantTitle'>
                <div>
                    { t('dialog.verifyParticipantQuestion', { participantName }) }
                </div>

                <div className = { classes.container }>
                    <div className = { classes.row }>
                        {/* @ts-ignore */}
                        {emoji.slice(0, 4).map((e: Array<string>) =>
                            (<div
                                className = { classes.item }
                                key = { e.toString() }>
                                <div className = { classes.emoji }>{ e[0] }</div>
                                <div>{ e[1].charAt(0).toUpperCase() + e[1].slice(1) }</div>
                            </div>))}
                    </div>

                    <div className = { classes.row }>
                        {/* @ts-ignore */}
                        {emoji.slice(4, 7).map((e: Array<string>) =>
                            (<div
                                className = { classes.item }
                                key = { e.toString() }>
                                <div className = { classes.emoji }>{ e[0] } </div>
                                <div>{ e[1].charAt(0).toUpperCase() + e[1].slice(1) }</div>
                            </div>))}
                    </div>

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
 * @param {IReduxState} state - The Redux state.
 * @param {IProps} ownProps - The own props of the component.
 * @returns {IProps}
 */
export function _mapStateToProps(state: IReduxState, ownProps: IProps) {
    const participant = getParticipantById(state, ownProps.pId);

    return {
        sas: ownProps.sas,
        pId: ownProps.pId,
        participantName: participant?.name
    };
}

export default translate(connect(_mapStateToProps)(

    // @ts-ignore
    withStyles(styles)(ParticipantVerificationDialog)));
