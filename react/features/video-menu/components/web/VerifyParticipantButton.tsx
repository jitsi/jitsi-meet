import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
import { IconCheck } from '../../../base/icons/svg';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import { startVerification } from '../../../e2ee/actions';
import { NOTIFY_CLICK_MODE } from '../../../toolbox/constants';

/**
 * The type of the React {@code Component} props of
 * {@link VerifyParticipantButton}.
 */
interface IProps {

    /**
     * The button key used to identify the click event.
     */
    buttonKey: string;

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: IStore['dispatch'];

    /**
     * Callback to execute when the button is clicked.
     */
    notifyClick?: Function;

    /**
     * Notify mode for `participantMenuButtonClicked` event -
     * whether to only notify or to also prevent button click routine.
     */
    notifyMode?: string;

    /**
      * The ID of the participant that this button is supposed to verified.
      */
    participantID: string;
}

const VerifyParticipantButton = ({
    buttonKey,
    dispatch,
    notifyClick,
    notifyMode,
    participantID
}: IProps) => {
    const { t } = useTranslation();

    const _handleClick = useCallback(() => {
        notifyClick?.(buttonKey);
        if (notifyMode !== NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY) {
            dispatch(startVerification(participantID));
        }
    }, [ dispatch, notifyClick, notifyMode, participantID, startVerification ]);

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
