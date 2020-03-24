// @flow

import { AtlasKitThemeProvider } from '@atlaskit/theme';
import React from 'react';

import { DialogContainer } from '../../base/dialog';
import { ChromeExtensionBanner } from '../../chrome-extension-banner';

import { AbstractApp } from './AbstractApp';

// Register middlewares and reducers.
import '../middlewares';
import '../reducers';

/**
 * Root app {@code Component} on Web/React.
 *
 * @extends AbstractApp
 */
export class App extends AbstractApp {
    /**
     * Overrides the parent method to inject {@link AtlasKitThemeProvider} as
     * the top most component.
     *
     * @override
     */
    _checkLastVisitedURL(): void {
        const lastVisitedUrlRefreshed = localStorage.getItem('lastVisitedUrlRefreshed');
        const lastVisitedUrl = localStorage.getItem('lastVisitedUrl');

        if (window.location.href.indexOf('?jwt=') > -1) {
            localStorage.setItem('lastVisitedUrl', window.location.href);
        }

        if (window.location.href.indexOf('?jwt=') < 0 && lastVisitedUrl
            && (!lastVisitedUrlRefreshed || lastVisitedUrlRefreshed === 'false')) {
            const roomName = window.location.pathname;

            if (lastVisitedUrl.indexOf(roomName) > -1) {
                window.location.href = lastVisitedUrl;
                localStorage.setItem('lastVisitedUrlRefreshed', 'true');
            }
        }
    }

    _createMainElement(component, props) {
        this._checkLastVisitedURL();

        return (
            <AtlasKitThemeProvider mode = 'dark'>
                <ChromeExtensionBanner />
                { super._createMainElement(component, props) }
            </AtlasKitThemeProvider>
        );
    }

    /**
     * Renders the platform specific dialog container.
     *
     * @returns {React$Element}
     */
    _renderDialogContainer() {
        return (
            <AtlasKitThemeProvider mode = 'dark'>
                <DialogContainer />
            </AtlasKitThemeProvider>
        );
    }
}
