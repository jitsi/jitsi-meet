import React, { useCallback, useMemo } from 'react';
import { Linking, View, ViewStyle } from 'react-native';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { getLegalUrls } from '../../../base/config/functions.native';
import Button from '../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';

import FormSection from './FormSection';
import styles from './styles';


const LinksSection = () => {
    const {
        privacy,
        helpCentre,
        terms
    } = useSelector((state: IReduxState) => getLegalUrls(state));

    const links = useMemo(() => [
        {
            label: 'settingsView.help',
            link: helpCentre
        },
        {
            label: 'settingsView.terms',
            link: terms
        },
        {
            label: 'settingsView.privacy',
            link: privacy
        }
    ], [ privacy, helpCentre, terms ]);

    const onLinkPress = useCallback(link => () => Linking.openURL(link), [ Linking ]);

    return (
        <FormSection>
            <View style = { styles.linksSection as ViewStyle }>
                {
                    links.map(({ label, link }) => (
                        <Button
                            accessibilityLabel = { label }
                            key = { label }
                            labelKey = { label }
                            onClick = { onLinkPress(link) }
                            style = { styles.linksButton }
                            type = { BUTTON_TYPES.TERTIARY } />
                    ))
                }
            </View>
        </FormSection>
    );
};

export default LinksSection;
