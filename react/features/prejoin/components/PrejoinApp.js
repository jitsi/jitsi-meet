// @flow

import { AtlasKitThemeProvider } from '@atlaskit/theme';
import React from 'react';
import { batch } from 'react-redux';

import { BaseApp } from '../../../features/base/app';
import { getConferenceOptions } from '../../base/conference/functions';
import { setConfig } from '../../base/config';
import { DialogContainer } from '../../base/dialog';
import { createPrejoinTracks } from '../../base/tracks';
import JitsiThemeProvider from '../../base/ui/components/JitsiThemeProvider';
import { initPrejoin, makePrecallTest } from '../actions';

import PrejoinThirdParty from './PrejoinThirdParty';

type Props = {

    /**
     * Indicates the style type that needs to be applied.
     */
    styleType: string
}

/**
 * Wrapper application for prejoin.
 *
 * @augments BaseApp
 */
export default class PrejoinApp extends BaseApp<Props> {
    _init: Promise<*>;

    /**
     * Navigates to {@link Prejoin} upon mount.
     *
     * @returns {void}
     */
    componentDidMount() {
        super.componentDidMount();

        this._init.then(async () => {
            const { store } = this.state;
            const { dispatch } = store;
            const { styleType } = this.props;

            super._navigate({
                component: PrejoinThirdParty,
                props: {
                    className: styleType
                }
            });

            const { startWithAudioMuted, startWithVideoMuted } = store.getState()['features/base/settings'];

            dispatch(setConfig({
                prejoinPageEnabled: true,
                startWithAudioMuted,
                startWithVideoMuted
            }));

            const { tryCreateLocalTracks, errors } = createPrejoinTracks();

            const tracks = await tryCreateLocalTracks;

            batch(() => {
                dispatch(initPrejoin(tracks, errors));
                dispatch(makePrecallTest(getConferenceOptions(store.getState())));
            });
        });
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
