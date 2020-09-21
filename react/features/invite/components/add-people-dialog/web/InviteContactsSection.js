// @flow

import React from 'react';

import { translate } from '../../../../base/i18n';

import InviteContactsForm from './InviteContactsForm';

type Props = {

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Component that represents the invitation section of the {@code AddPeopleDialog}.
 *
 * @returns {ReactElement$<any>}
 */
function InviteContactsSection({ t }: Props) {
    return (
        <>
            <span>{t('addPeople.addContacts')}</span>
            <InviteContactsForm />
            <div className = 'invite-more-dialog separator' />
        </>
    );
}

export default translate(InviteContactsSection);
