import React from 'react';
import { WithTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../../app/types';
import { translate } from '../../../i18n/functions';
import { getParticipantDisplayName } from '../../../participants/functions';
import Dialog from '../../../ui/components/web/Dialog';


interface IProps extends WithTranslation {

    /**
     * The participant id of the toggle camera requester.
     */
    initiatorId: string;

    /**
     * Function to be invoked after permission to toggle camera granted.
     */
    onAllow: () => void;
}

/**
 * Dialog to allow toggling camera remotely.
 *
 * @returns {JSX.Element} - The allow toggle camera dialog.
 */
const AllowToggleCameraDialog = ({ onAllow, t, initiatorId }: IProps): JSX.Element => {
    const initiatorName = useSelector((state: IReduxState) => getParticipantDisplayName(state, initiatorId));

    return (
        <Dialog
            ok = {{ translationKey: 'dialog.allow' }}
            onSubmit = { onAllow }
            titleKey = 'dialog.allowToggleCameraTitle'>
            <div>
                { t('dialog.allowToggleCameraDialog', { initiatorName }) }
            </div>
        </Dialog>
    );
};

export default translate(AllowToggleCameraDialog);
