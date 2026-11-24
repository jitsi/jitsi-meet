import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { updateSettings } from '../../../base/settings/actions';
import { shouldHideShareAudioHelper } from '../../../base/settings/functions.web';
import { toggleScreensharing } from '../../../base/tracks/actions.web';
import Checkbox from '../../../base/ui/components/web/Checkbox';
import Dialog from '../../../base/ui/components/web/Dialog';

/**
 * Component that displays the audio screen share helper dialog.
 *
 * @returns {ReactElement}
 */
const ShareAudioDialog = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const _shouldHideShareAudioHelper = useSelector(
        (state: IReduxState) => Boolean(shouldHideShareAudioHelper(state))
    );

    /**
     * Continue the normal screen sharing flow when the user clicks continue.
     *
     * @returns {boolean}
     */
    const _onContinue = useCallback(() => {
        // Pass undefined as the first parameter so the underlying logic decides weather or not to stop screen sharing.
        dispatch(toggleScreensharing(undefined, true));

        return true;
    }, [ dispatch ]);

    /**
     * Callback invoked when the hide audio helper checkbox has been selected. This setting will be persisted in
     * the local storage, thus the dialog won't be displayed again.
     *
     * @param {React.ChangeEvent<HTMLInputElement>} e - The change event to handle.
     * @returns {void}
     */
    const _onSelectHideShareAudioHelper = useCallback((
            { target: { checked } }: React.ChangeEvent<HTMLInputElement>
    ) => {
        dispatch(updateSettings({ hideShareAudioHelper: checked }));
    }, [ dispatch ]);

    return (
        <Dialog
            ok = {{ translationKey: 'dialog.shareAudio' }}
            onSubmit = { _onContinue }
            size = 'large'
            titleKey = { t('dialog.shareAudioTitle') }>
            <div className = 'share-audio-dialog'>
                <img
                    alt = { t('dialog.shareAudioAltText') }
                    className = 'share-audio-animation'
                    src = 'images/share-audio.gif'
                    tabIndex = { 0 } />
                <Checkbox
                    checked = { _shouldHideShareAudioHelper }
                    label = { t('dialog.hideShareAudioHelper') }
                    name = 'hide-share-audio-helper'
                    onChange = { _onSelectHideShareAudioHelper } />
            </div>
        </Dialog>
    );
};

export default ShareAudioDialog;
