import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import AudioTranslationDialog from '../../../audio-translation/components/web/AudioTranslationDialog';
import { getEffectiveTranslationLanguage } from '../../../audio-translation/functions';
import { openDialog } from '../../../base/dialog/actions';
import { IconTranslate } from '../../../base/icons/svg';
import DisabledReasonTooltip from '../../../base/tooltip/components/DisabledReasonTooltip';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import { isE2EEOnInMeeting } from '../../../e2ee/functions';
import { NOTIFY_CLICK_MODE } from '../../../toolbox/types';
import { IButtonProps } from '../../types';

/**
 * A participant/thumbnail menu item that opens the AI audio-translation language
 * selector scoped to a single participant.
 *
 * @param {IButtonProps} props - The component's props.
 * @returns {JSX.Element}
 */
const TranslateParticipantButton = ({ notifyClick, notifyMode, participantID }: IButtonProps): JSX.Element => {
    const dispatch = useDispatch();
    const { t } = useTranslation();

    // Live translation is ruled out while end-to-end encryption is on; one already on can still be turned off.
    const disabled = useSelector((state: IReduxState) => isE2EEOnInMeeting(state)
        && !getEffectiveTranslationLanguage(state, participantID));
    const reason = disabled ? t('audioTranslation.unavailableWithE2EE') : undefined;

    const _onClick = useCallback(() => {
        notifyClick?.();
        if (notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY) {
            return;
        }
        dispatch(openDialog('AudioTranslationDialog', AudioTranslationDialog, { participantId: participantID }));
    }, [ dispatch, notifyClick, notifyMode, participantID ]);

    return (
        <DisabledReasonTooltip reason = { reason }>
            <ContextMenuItem
                accessibilityLabel = { t('toolbar.audioTranslation') }
                description = { reason }
                disabled = { disabled }
                icon = { IconTranslate }
                onClick = { _onClick }
                text = { t('toolbar.audioTranslation') } />
        </DisabledReasonTooltip>
    );
};

export default TranslateParticipantButton;
