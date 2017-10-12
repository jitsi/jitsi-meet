/* global $, APP */

/* eslint-disable no-unused-vars */
import React from 'react';
import ReactDOM from 'react-dom';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';

import { i18next } from '../../../../react/features/base/i18n';
import { ContactListPanel } from '../../../../react/features/contact-list';
/* eslint-enable no-unused-vars */

import UIUtil from '../../util/UIUtil';

/**
 * Contact list.
 *
 * FIXME: One day this view should no longer be called "contact list" because
 * the term "contact" is not used elsewhere. Normally people in the conference
 * are internally refered to as "participants" or externally as "members".
 */
const ContactListView = {
    /**
     * Creates and appends the contact list to the side panel.
     *
     * @returns {void}
     */
    init() {
        const contactListPanelContainer = document.createElement('div');

        contactListPanelContainer.id = 'contacts_container';
        contactListPanelContainer.className = 'sideToolbarContainer__inner';

        $('#sideToolbarContainer').append(contactListPanelContainer);

        ReactDOM.render(
            <Provider store = { APP.store }>
                <I18nextProvider i18n = { i18next }>
                    <ContactListPanel />
                </I18nextProvider>
            </Provider>,
            contactListPanelContainer
        );
    },

    /**
     * Indicates if the contact list is currently visible.
     *
     * @return {boolean) true if the contact list is currently visible.
     */
    isVisible() {
        return UIUtil.isVisible(document.getElementById('contactlist'));
    }
};

export default ContactListView;
