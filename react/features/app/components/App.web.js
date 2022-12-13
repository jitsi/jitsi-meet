import { AtlasKitThemeProvider } from '@atlaskit/theme';
import React from 'react';

import GlobalStyles from '../../base/ui/components/GlobalStyles.web';
import JitsiThemeProvider from '../../base/ui/components/JitsiThemeProvider.web';
import DialogContainer from '../../base/ui/components/web/DialogContainer';
import { ChromeExtensionBanner } from '../../chrome-extension-banner';
import { OverlayContainer } from '../../overlay';

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
     * Creates an extra {@link ReactElement}s to be added (unconditionally)
     * alongside the main element.
     *
     * @abstract
     * @protected
     * @returns {ReactElement}
     */
    _createExtraElement() {
        return (
            <>
                <OverlayContainer />
            </>
        );
    }

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
