import React from 'react';
import { useTranslation } from 'react-i18next';

import InviteContactsForm from './InviteContactsForm';

/**
 * Component that represents the invitation section of the {@code AddPeopleDialog}.
 *
 * @returns {ReactElement$<any>}
 */
function InviteContactsSection() {
    const { t } = useTranslation();

    return (
        <>
            <span>{t('addPeople.addContacts')}</span>
            <InviteContactsForm />
            <div className = 'invite-more-dialog separator' />
        </>
    );
}

export default InviteContactsSection;
