import React from 'react';
import ReactDOM from 'react-dom';
import { I18nextProvider } from 'react-i18next';

import { isMobileBrowser } from '../../../base/environment/utils';
import { i18next } from '../../../base/i18n';
import { parseURLParams } from '../../../base/util/parseURLParams';
import { DIAL_IN_INFO_PAGE_PATH_NAME } from '../../constants';
import { DialInSummary } from '../dial-in-summary';

import NoRoomError from './NoRoomError';

document.addEventListener('DOMContentLoaded', () => {
    const { room } = parseURLParams(window.location, true, 'search');
    const { href } = window.location;
    const ix = href.indexOf(DIAL_IN_INFO_PAGE_PATH_NAME);
    const url = (ix > 0 ? href.substring(0, ix) : href) + room;

    ReactDOM.render(
        <I18nextProvider i18n = { i18next }>
            { room
                ? <DialInSummary
                    className = 'dial-in-page'
                    clickableNumbers = { isMobileBrowser() }
                    room = { decodeURIComponent(room) }
                    url = { url } />
                : <NoRoomError className = 'dial-in-page' /> }
        </I18nextProvider>,
        document.getElementById('react')
    );
});

window.addEventListener('beforeunload', () => {
    ReactDOM.unmountComponentAtNode(document.getElementById('react'));
});
