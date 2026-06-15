import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import AudioTranslationDialog from '../../../audio-translation/components/web/AudioTranslationDialog';
import { openDialog } from '../../../base/dialog/actions';
import { IconSubtitles } from '../../../base/icons/svg';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
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

    const _onClick = useCallback(() => {
        notifyClick?.();
        if (notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY) {
            return;
        }
        dispatch(openDialog('AudioTranslationDialog', AudioTranslationDialog, { participantId: participantID }));
    }, [ dispatch, notifyClick, notifyMode, participantID ]);

    return (
        <ContextMenuItem
            accessibilityLabel = { t('toolbar.audioTranslation') }
            icon = { IconSubtitles }
            onClick = { _onClick }
            text = { t('toolbar.audioTranslation') } />
    );
};

export default TranslateParticipantButton;
