import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import AudioTranslationDialog from '../../../audio-translation/components/web/AudioTranslationDialog';
import { openDialog } from '../../../base/dialog/actions';
import { IconTranslate } from '../../../base/icons/svg';
import Tooltip from '../../../base/tooltip/components/Tooltip';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import { isE2EEEnabled } from '../../../e2ee/functions';
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

    // Live translation is ruled out while end-to-end encryption is on; one already on can still be changed or off.
    const disabled = useSelector((state: IReduxState) => isE2EEEnabled(state)
        && !state['features/audio-translation'].participantLanguages[participantID]);

    const _onClick = useCallback(() => {
        notifyClick?.();
        if (notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY) {
            return;
        }
        dispatch(openDialog('AudioTranslationDialog', AudioTranslationDialog, { participantId: participantID }));
    }, [ dispatch, notifyClick, notifyMode, participantID ]);

    const item = (
        <ContextMenuItem
            accessibilityLabel = { t('toolbar.audioTranslation') }
            disabled = { disabled }
            icon = { IconTranslate }
            onClick = { _onClick }
            text = { t('toolbar.audioTranslation') } />
    );

    return disabled ? <Tooltip content = { t('audioTranslation.unavailableWithE2EE') }>{ item }</Tooltip> : item;
};

export default TranslateParticipantButton;
