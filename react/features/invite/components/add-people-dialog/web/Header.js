// @flow

import React from 'react';

import { translate } from '../../../../base/i18n';
import { Icon, IconClose } from '../../../../base/icons';

type Props = {

    /**
     * The {@link ModalDialog} closing function.
     */
    onClose: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Custom header of the {@code AddPeopleDialog}.
 *
 * @returns {React$Element<any>}
 */
function Header({ onClose, t }: Props) {
    return (
        <div
            className = 'invite-more-dialog header'>
            { t('addPeople.inviteMorePrompt') }
            <Icon
                onClick = { onClose }
                src = { IconClose } />
        </div>
    );
}

export default translate(Header);
