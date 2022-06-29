import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from 'react-native-paper';

import BaseTheme from '../../../../base/ui/components/BaseTheme.native';


interface PrimaryButtonProps {
    icon: any;
    label: string;
    labelStyle: any;
    mode: any;
    onPress: any;
    style: any;
}


const PrimaryButton: React.FC<PrimaryButtonProps> = ({
    icon, label, labelStyle, mode, onPress, style
}: PrimaryButtonProps) => {
    const { t } = useTranslation();

    return (
        <Button
            children = { t(label) }
            color = { BaseTheme.palette.action01 }
            icon = { icon }
            labelStyle = { [
                styles.primaryButtonLabel,
                labelStyle
            ] }
            mode = { mode }
            onPress = { onPress }
            style = { [
                styles.primaryButton,
                style
            ] } />
    );
};

export default PrimaryButton;
