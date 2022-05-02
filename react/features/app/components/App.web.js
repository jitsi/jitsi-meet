// @flow

import { AtlasKitThemeProvider } from '@atlaskit/theme';
import React from 'react';

import { DialogContainer } from '../../base/dialog';
import GlobalStyles from '../../base/ui/components/GlobalStyles';
import JitsiThemeProvider from '../../base/ui/components/JitsiThemeProvider';
import { ChromeExtensionBanner } from '../../chrome-extension-banner';

import { AbstractApp } from './AbstractApp';

// Register middlewares and reducers.
import '../middlewares';
import '../reducers';

/**
 * Root app {@code Component} on Web/React.
 *
 * @augments AbstractApp
 */
export class App extends AbstractApp {
    /**
     * Overrides the parent method to inject {@link AtlasKitThemeProvider} as
     * the top most component.
     *
     * @override
     */
    _createMainElement(component, props) {
        return (
            <JitsiThemeProvider>
                <AtlasKitThemeProvider mode = 'dark'>
                    <GlobalStyles />
                    <ChromeExtensionBanner />
                    { super._createMainElement(component, props) }
                </AtlasKitThemeProvider>
            </JitsiThemeProvider>
        );
    }

    /**
     * Renders the platform specific dialog container.
     *
     * @returns {React$Element}
     */
    _renderDialogContainer() {
        return (
            <JitsiThemeProvider>
                <AtlasKitThemeProvider mode = 'dark'>
                    <DialogContainer />
                </AtlasKitThemeProvider>
            </JitsiThemeProvider>
        );
    }
}
