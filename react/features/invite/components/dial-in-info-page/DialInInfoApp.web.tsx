import React from 'react';
import { Root, createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';

import { isMobileBrowser } from '../../../base/environment/utils';
import i18next from '../../../base/i18n/i18next';
import { parseURLParams } from '../../../base/util/parseURLParams';
import { DIAL_IN_INFO_PAGE_PATH_NAME } from '../../constants';
import DialInSummary from '../dial-in-summary/web/DialInSummary';

import NoRoomError from './NoRoomError.web';

let root: Root | null = null;

function mountApp() {
    const container = document.getElementById('react');

    if (!container) {
        return;
    }

    const { room } = parseURLParams(window.location.href, true, 'search');
    const { href } = window.location;
    const ix = href.indexOf(DIAL_IN_INFO_PAGE_PATH_NAME);
    const url = (ix > 0 ? href.substring(0, ix) : href) + room;

    root = createRoot(container);
    root.render(
        <I18nextProvider i18n = { i18next }>
            {room
                ? (
                    <DialInSummary
                        className = 'dial-in-page'
                        clickableNumbers = { isMobileBrowser() }
                        room = { decodeURIComponent(room) }
                        url = { url } />
                )
                : <NoRoomError className = 'dial-in-page' />}
        </I18nextProvider>
    );
}

function unmountApp() {
    if (root) {
        root.unmount();
        root = null;
    }
}

document.addEventListener('DOMContentLoaded', mountApp);
window.addEventListener('beforeunload', unmountApp);
