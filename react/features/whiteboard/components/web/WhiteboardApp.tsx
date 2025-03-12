import { generateCollaborationLinkData } from '@jitsi/excalidraw';
import React, { ComponentType } from 'react';

import BaseApp from '../../../base/app/components/BaseApp';
import GlobalStyles from '../../../base/ui/components/GlobalStyles.web';
import JitsiThemeProvider from '../../../base/ui/components/JitsiThemeProvider.web';
import { decodeFromBase64URL } from '../../../base/util/httpUtils';
import { parseURLParams } from '../../../base/util/parseURLParams';
import { safeDecodeURIComponent } from '../../../base/util/uri';
import logger from '../../logger';

import NoWhiteboardError from './NoWhiteboardError';
import WhiteboardWrapper from './WhiteboardWrapper';

/**
 * Wrapper application for the whiteboard.
 *
 * @augments BaseApp
 */
export default class WhiteboardApp extends BaseApp<any> {
    /**
     * Navigates to {@link Whiteboard} upon mount.
     *
     * @returns {void}
     */
    override async componentDidMount() {
        await super.componentDidMount();

        const { state } = parseURLParams(window.location.href, true);
        const decodedState = JSON.parse(decodeFromBase64URL(state));
        const { collabServerUrl, localParticipantName } = decodedState;
        let { roomId, roomKey } = decodedState;

        if (!roomId && !roomKey) {
            try {
                const collabDetails = await generateCollaborationLinkData();

                roomId = collabDetails.roomId;
                roomKey = collabDetails.roomKey;

                if (window.ReactNativeWebView) {
                    setTimeout(() => {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            collabDetails,
                            collabServerUrl
                        }));
                    }, 0);
                }
            } catch (e: any) {
                logger.error('Couldn\'t generate collaboration link data.', e);
            }
        }

        super._navigate({
            component: () => (
                <>{
                    roomId && roomKey && collabServerUrl
                        ? <WhiteboardWrapper
                            className = 'whiteboard'
                            collabDetails = {{
                                roomId,
                                roomKey
                            }}
                            collabServerUrl = { safeDecodeURIComponent(collabServerUrl) }
                            localParticipantName = { localParticipantName } />
                        : <NoWhiteboardError className = 'whiteboard' />
                }</>
            ) });
    }

    /**
     * Overrides the parent method to inject {@link AtlasKitThemeProvider} as
     * the top most component.
     *
     * @override
     */
    override _createMainElement(component: ComponentType<any>, props: Object) {
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
    override _renderDialogContainer() {
        return null;
    }
}
