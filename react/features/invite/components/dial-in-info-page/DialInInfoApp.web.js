import React from 'react';
import ReactDOM from 'react-dom';
import { I18nextProvider } from 'react-i18next';

import parseURLParams from '../../../base/config/parseURLParams';
import { i18next } from '../../../base/i18n';

import { DialInSummary } from '../dial-in-summary';

document.addEventListener('DOMContentLoaded', () => {
    const params = parseURLParams(window.location, true, 'search');

    ReactDOM.render(
        <I18nextProvider i18n = { i18next }>
            <DialInSummary
                className = 'dial-in-page'
                clickableNumbers = { false }
                room = { params.room } />
        </I18nextProvider>,
        document.getElementById('react')
    );
});

window.addEventListener('beforeunload', () => {
    ReactDOM.unmountComponentAtNode(document.getElementById('react'));
});
