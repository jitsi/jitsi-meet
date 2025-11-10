import React from "react";
import GlobalStyles from "../../base/ui/components/GlobalStyles.web";
import JitsiThemeProvider from "../../base/ui/components/JitsiThemeProvider.web";
import DialogContainer from "../../base/ui/components/web/DialogContainer";
import ChromeExtensionBanner from "../../chrome-extension-banner/components/ChromeExtensionBanner.web";
import OverlayContainer from "../../overlay/components/web/OverlayContainer";
import { AbstractApp } from "./AbstractApp";

// Register middlewares and reducers.
import MobileView from "../../base/meet/views/mobile/MobileView";
import GlobalLoader from "../../base/meet/loader/components/GlobalLoader";
import "../middlewares";
import "../reducers";

/**
 * Root app {@code Component} on Web/React.
 *
 * @augments AbstractApp
 */
export class App extends AbstractApp {
    /**
     * Detect if device is a smartphone
     * @private
     * @returns {boolean}
     */
    _isMobileDevice(): boolean {
        const isIphone = /iPhone/i.test(navigator.userAgent);
        const isAndroid = /Android/i.test(navigator.userAgent);

        return isIphone || isAndroid;
    }

    /**
     * Creates an extra {@link ReactElement}s to be added (unconditionally)
     * alongside the main element.
     *
     * @abstract
     * @protected
     * @returns {ReactElement}
     */
    override _createExtraElement() {
        return (
            <JitsiThemeProvider>
                <OverlayContainer />
                <GlobalLoader />
            </JitsiThemeProvider>
        );
    }

    /**
     * Overrides the parent method to inject {@link AtlasKitThemeProvider} as
     * the top most component.
     *
     * @override
     */
    override _createMainElement(component: React.ComponentType, props?: Object) {
        const isMobile = this._isMobileDevice();
        if (isMobile) {
            return (
                <JitsiThemeProvider>
                    <GlobalStyles />
                    <MobileView />
                </JitsiThemeProvider>
            );
        }

        return (
            <JitsiThemeProvider>
                <GlobalStyles />
                <ChromeExtensionBanner />
                {super._createMainElement(component, props)}
            </JitsiThemeProvider>
        );
    }

    /**
     * Renders the platform specific dialog container.
     *
     * @returns {React$Element}
     */
    override _renderDialogContainer() {
        return (
            <JitsiThemeProvider>
                <DialogContainer />
            </JitsiThemeProvider>
        );
    }
}
