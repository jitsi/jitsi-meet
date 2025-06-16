import React, { ComponentType } from 'react';

import BaseApp from '../../../../base/app/components/BaseApp';
import { isMobileBrowser } from '../../../../base/environment/utils';
import GlobalStyles from '../../../../base/ui/components/GlobalStyles.web';
import JitsiThemeProvider from '../../../../base/ui/components/JitsiThemeProvider.web';
import { parseURLParams } from '../../../../base/util/parseURLParams';
import { DIAL_IN_INFO_PAGE_PATH_NAME } from '../../../constants';
import NoRoomError from '../../dial-in-info-page/NoRoomError.web';

import DialInSummary from './DialInSummary';

/**
 * Wrapper application for prejoin.
 *
 * @augments BaseApp
 */
export default class DialInSummaryApp extends BaseApp<any> {
    /**
     * Navigates to {@link Prejoin} upon mount.
     *
     * @returns {void}
     */
    async componentDidMount() {
        await super.componentDidMount();

        // @ts-ignore
        const { room } = parseURLParams(window.location, true, 'search');
        const { href } = window.location;
        const ix = href.indexOf(DIAL_IN_INFO_PAGE_PATH_NAME);
        const url = (ix > 0 ? href.substring(0, ix) : href) + room;

        super._navigate({
            component: () => (<>
                {room
                    ? <DialInSummary
                        className = 'dial-in-page'
                        clickableNumbers = { isMobileBrowser() }
                        room = { decodeURIComponent(room) }
                        scrollable = { true }
                        showTitle = { true }
                        url = { url } />
                    : <NoRoomError className = 'dial-in-page' />}
            </>)
        });
    }

    /**
     * Overrides the parent method to inject {@link AtlasKitThemeProvider} as
     * the top most component.
     *
     * @override
     */
    _createMainElement(component: ComponentType<any>, props: Object) {
        return (
            <JitsiThemeProvider>
                <GlobalStyles />
                {super._createMainElement(component, props)}
            </JitsiThemeProvider>
        );
    }

    /**
     * Renders the platform specific dialog container.
     *
     * @returns {React$Element}
     */
    _renderDialogContainer() {
        return null;
    }
}
