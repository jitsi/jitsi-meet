import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
import { IconCheck } from '../../../base/icons/svg';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import { startVerification } from '../../../e2ee/actions';

/**
 * The type of the React {@code Component} props of
 * {@link VerifyParticipantButton}.
 */
interface IProps {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: IStore['dispatch'];

    /**
      * The ID of the participant that this button is supposed to verified.
      */
    participantID: string;
}

const VerifyParticipantButton = ({
    dispatch,
    participantID
}: IProps) => {
    const { t } = useTranslation();

    const _handleClick = useCallback(() => {
        dispatch(startVerification(participantID));
    }, [ participantID ]);

    return (
        <ContextMenuItem
            accessibilityLabel = { t('videothumbnail.verify') }
            className = 'verifylink'
            icon = { IconCheck }
            id = { `verifylink_${participantID}` }
            // eslint-disable-next-line react/jsx-handler-names
            onClick = { _handleClick }
            text = { t('videothumbnail.verify') } />
    );
};

/**
 * Maps (parts of) the Redux state to the associated {@code RemoteVideoMenuTriggerButton}'s props.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState, ownProps: Partial<IProps>) {
    const { participantID } = ownProps;

    return {
        _participantID: participantID
    };
}

export default connect(_mapStateToProps)(VerifyParticipantButton);
