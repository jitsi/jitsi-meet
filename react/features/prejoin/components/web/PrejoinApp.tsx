import React, { ComponentType } from 'react';
import { batch } from 'react-redux';

import BaseApp from '../../../base/app/components/BaseApp';
import { setConfig } from '../../../base/config/actions';
import { createPrejoinTracks } from '../../../base/tracks/functions.web';
import GlobalStyles from '../../../base/ui/components/GlobalStyles.web';
import JitsiThemeProvider from '../../../base/ui/components/JitsiThemeProvider.web';
import DialogContainer from '../../../base/ui/components/web/DialogContainer';
import { setupInitialDevices } from '../../../conference/actions.web';
import { initPrejoin } from '../../actions.web';

import PrejoinThirdParty from './PrejoinThirdParty';

type Props = {

    /**
     * Indicates the style type that needs to be applied.
     */
    styleType: string;
};

/**
 * Wrapper application for prejoin.
 *
 * @augments BaseApp
 */
export default class PrejoinApp extends BaseApp<Props> {

    /**
     * Navigates to {@link Prejoin} upon mount.
     *
     * @returns {void}
     */
    async componentDidMount() {
        await super.componentDidMount();

        const { store } = this.state;
        const { dispatch } = store ?? {};
        const { styleType } = this.props;

        super._navigate({
            component: PrejoinThirdParty,
            props: {
                className: styleType
            }
        });

        const { startWithAudioMuted, startWithVideoMuted } = store
            ? store.getState()['features/base/settings']
            : { startWithAudioMuted: undefined,
                startWithVideoMuted: undefined };

        dispatch?.(setConfig({
            prejoinConfig: {
                enabled: true
            },
            startWithAudioMuted,
            startWithVideoMuted
        }));

        await dispatch?.(setupInitialDevices());
        const { tryCreateLocalTracks, errors } = createPrejoinTracks();

        const tracks = await tryCreateLocalTracks;

        batch(() => {
            dispatch?.(initPrejoin(tracks, errors));
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
                { super._createMainElement(component, props) }
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
                <DialogContainer />
            </JitsiThemeProvider>
        );
    }
}
