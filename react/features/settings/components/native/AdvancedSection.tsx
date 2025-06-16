import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, NativeModules, Platform, Text } from 'react-native';
import { Divider } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { updateSettings } from '../../../base/settings/actions';
import Switch from '../../../base/ui/components/native/Switch';

import FormRow from './FormRow';
import FormSection from './FormSection';
import styles from './styles';

const { AppInfo } = NativeModules;

const AdvancedSection = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const {
        disableCrashReporting,
        disableCallIntegration,
        disableP2P
    } = useSelector((state: IReduxState) => state['features/base/settings']);

    const onSwitchToggled = useCallback((name: string) => (enabled?: boolean) => {

        if (name === 'disableCrashReporting' && enabled === true) {
            Alert.alert(
                t('settingsView.alertTitle'),
                t('settingsView.disableCrashReportingWarning'),
                [
                    {
                        onPress: () => dispatch(updateSettings({ disableCrashReporting: true })),
                        text: t('settingsView.alertOk')
                    },
                    {
                        text: t('settingsView.alertCancel')
                    }
                ]
            );
        } else {
            dispatch(updateSettings({ [name]: enabled }));
        }
    }, [ dispatch, updateSettings ]);

    const switches = useMemo(() => {
        const partialSwitches = [
            {
                label: 'settingsView.disableCallIntegration',
                state: disableCallIntegration,
                name: 'disableCallIntegration'
            },
            {
                label: 'settingsView.disableP2P',
                state: disableP2P,
                name: 'disableP2P'
            },
            {
                label: 'settingsView.disableCrashReporting',
                state: disableCrashReporting,
                name: 'disableCrashReporting'
            }
        ];

        if (Platform.OS !== 'android') {
            partialSwitches.shift();
        }

        if (!AppInfo.GOOGLE_SERVICES_ENABLED) {
            partialSwitches.pop();
        }

        return partialSwitches;
    }, [ disableCallIntegration, disableP2P, disableCrashReporting ]);

    return (
        <>
            <FormSection
                label = 'settingsView.advanced'>
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
            {/* @ts-ignore */}
            <Divider style = { styles.fieldSeparator } />
            <FormSection
                label = 'settingsView.buildInfoSection'>
                <FormRow
                    label = 'settingsView.version'>
                    <Text style = { styles.text }>
                        {`${AppInfo.version} build ${AppInfo.buildNumber}`}
                    </Text>
                </FormRow>
                <FormRow
                    label = 'settingsView.sdkVersion'>
                    <Text style = { styles.text }>
                        {AppInfo.sdkVersion}
                    </Text>
                </FormRow>
            </FormSection>
        </>
    );
};

export default AdvancedSection;
