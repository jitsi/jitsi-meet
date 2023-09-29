import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState, IStore } from '../../app/types';
import { getParticipantById } from '../../base/participants/functions';
import Dialog from '../../base/ui/components/web/Dialog';
import { participantVerified } from '../actions';
import { ISas } from '../reducer';

interface IProps {
    decimal: string;
    dispatch: IStore['dispatch'];
    emoji: string;
    pId: string;
    participantName?: string;
    sas: ISas;
}

const useStyles = makeStyles()(() => {
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
});

const ParticipantVerificationDialog = ({
    dispatch,
    participantName,
    pId,
    sas
}: IProps) => {
    const { classes } = useStyles();
    const { t } = useTranslation();

    const _onDismissed = useCallback(() => {
        dispatch(participantVerified(pId, false));

        return true;
    }, [ pId ]);

    const _onConfirmed = useCallback(() => {
        dispatch(participantVerified(pId, true));

        return true;
    }, [ pId ]);

    const { emoji } = sas;

    return (
        <Dialog
            cancel = {{ translationKey: 'dialog.verifyParticipantDismiss' }}
            ok = {{ translationKey: 'dialog.verifyParticipantConfirm' }}
            onCancel = { _onDismissed }
            onSubmit = { _onConfirmed }
            titleKey = 'dialog.verifyParticipantTitle'>
            <div>
                {t('dialog.verifyParticipantQuestion', { participantName })}
            </div>

            <div className = { classes.container }>
                <div className = { classes.row }>
                    {/* @ts-ignore */}
                    {emoji.slice(0, 4).map((e: Array<string>) =>
                        (<div
                            className = { classes.item }
                            key = { e.toString() }>
                            <div className = { classes.emoji }>{e[0]}</div>
                            <div>{e[1].charAt(0).toUpperCase() + e[1].slice(1)}</div>
                        </div>))}
                </div>

                <div className = { classes.row }>
                    {/* @ts-ignore */}
                    {emoji.slice(4, 7).map((e: Array<string>) =>
                        (<div
                            className = { classes.item }
                            key = { e.toString() }>
                            <div className = { classes.emoji }>{e[0]} </div>
                            <div>{e[1].charAt(0).toUpperCase() + e[1].slice(1)}</div>
                        </div>))}
                </div>

            </div>

        </Dialog>
    );
};

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

export default connect(_mapStateToProps)(ParticipantVerificationDialog);
