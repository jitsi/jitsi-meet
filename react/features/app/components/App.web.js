import { AtlasKitThemeProvider } from '@atlaskit/theme';
import React from 'react';

import '../../base/responsive-ui';
import '../../chat';
import '../../room-lock';
import '../../video-layout';

import { AbstractApp } from './AbstractApp';

/**
 * Root application component.
 *
 * @extends AbstractApp
 */
export class App extends AbstractApp {
    /**
     * App component's property types.
     *
     * @static
     */
    static propTypes = AbstractApp.propTypes;

    /**
     * Overrides the parent method to inject {@link AtlasKitThemeProvider} as
     * the top most component.
     *
     * @override
     */
    _createElement(component, props) {
        return (
            <AtlasKitThemeProvider mode = 'dark'>
                { super._createElement(component, props) }
            </AtlasKitThemeProvider>
        );
    }

    /**
     * Gets a Location object from the window with information about the current
     * location of the document.
     *
     * @inheritdoc
     */
    getWindowLocation() {
        return window.location;
    }
}
