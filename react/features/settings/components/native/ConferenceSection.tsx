import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { getDefaultURL } from '../../../app/functions.native';
import { IReduxState } from '../../../app/types';
import { updateSettings } from '../../../base/settings/actions';
import Input from '../../../base/ui/components/native/Input';
import Switch from '../../../base/ui/components/native/Switch';
import { isServerURLChangeEnabled, normalizeUserInputURL } from '../../functions.native';

import FormRow from './FormRow';
import FormSection from './FormSection';
import styles from './styles';


const ConferenceSection = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const {
        serverURL,
        startCarMode,
        startWithAudioMuted,
        startWithVideoMuted
    } = useSelector((state: IReduxState) => state['features/base/settings']);

    const defaultServerURL = useSelector((state: IReduxState) => getDefaultURL(state));
    const [ newServerURL, setNewServerURL ] = useState(serverURL ?? '');

    const serverURLChangeEnabled = useSelector((state: IReduxState) => isServerURLChangeEnabled(state));

    const switches = useMemo(() => [
        {
            label: 'settingsView.startCarModeInLowBandwidthMode',
            state: startCarMode,
            name: 'startCarMode'
        },
        {
            label: 'settingsView.startWithAudioMuted',
            state: startWithAudioMuted,
            name: 'startWithAudioMuted'
        },
        {
            label: 'settingsView.startWithVideoMuted',
            state: startWithVideoMuted,
            name: 'startWithVideoMuted'
        }
    ], [ startCarMode, startWithAudioMuted, startWithVideoMuted ]);

    const onChangeServerURL = useCallback(value => {

        setNewServerURL(value);
        dispatch(updateSettings({
            serverURL: value
        }));
    }, [ dispatch, newServerURL ]);

    const processServerURL = useCallback(() => {
        const normalizedURL = normalizeUserInputURL(newServerURL);

        onChangeServerURL(normalizedURL);
    }, [ newServerURL ]);

    useEffect(() => () => processServerURL(), []);

    const onSwitchToggled = useCallback((name: string) => (enabled?: boolean) => {

        // @ts-ignore
        dispatch(updateSettings({ [name]: enabled }));
    }, [ dispatch ]);

    return (
        <FormSection
            label = 'settingsView.conferenceSection'>
            <Input
                autoCapitalize = 'none'
                customStyles = {{ container: styles.customContainer }}
                editable = { serverURLChangeEnabled }
                keyboardType = { 'url' }
                label = { t('settingsView.serverURL') }
                onBlur = { processServerURL }
                onChange = { onChangeServerURL }
                placeholder = { defaultServerURL }
                textContentType = { 'URL' } // iOS only
                value = { newServerURL } />
            {
                switches.map(({ label, state, name }) => (
                    <FormRow
                        key = { label }
                        label = { label }>
                        <Switch
                            checked = { Boolean(state) }
                            onChange = { onSwitchToggled(name) } />
                    </FormRow>
                ))
            }
        </FormSection>
    );
};

export default ConferenceSection;
