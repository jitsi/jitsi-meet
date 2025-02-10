import React from 'react';
import { Image, View, ViewStyle } from 'react-native';
import { SvgCssUri } from 'react-native-svg';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';

import styles from './styles';


export interface ICustomOptionButton extends AbstractButtonProps {
    backgroundColor?: string;
    icon: any;
    id?: string;
    isToolboxButton?: boolean;
    text: string;
}

/**
 * Component that renders a custom button.
 *
 * @returns {Component}
 */
class CustomOptionButton extends AbstractButton<ICustomOptionButton> {
    backgroundColor = this.props.backgroundColor;
    iconSrc = this.props.icon;
    id = this.props.id;
    text = this.props.text;

    /**
     * Custom icon component.
     *
     * @returns {React.Component}
     */
    icon = () => {
        let iconComponent;

        if (!this.iconSrc) {
            return null;
        }

        if (this.iconSrc?.includes('svg')) {
            iconComponent = (
                <SvgCssUri
                    height = { BaseTheme.spacing[4] }
                    uri = { this.iconSrc }
                    width = { BaseTheme.spacing[4] } />
            );
        } else {
            iconComponent = (
                <Image
                    height = { BaseTheme.spacing[4] }
                    resizeMode = { 'contain' }
                    source = {{ uri: this.iconSrc }}
                    width = { BaseTheme.spacing[4] } />
            );
        }

        return (
            <View
                style = { this.props.isToolboxButton && [
                    styles.toolboxButtonIconContainer,
                    { backgroundColor: this.backgroundColor } ] as ViewStyle }>
                { iconComponent }
            </View>
        );
    };

    label = this.text || '';
}

export default translate(connect()(CustomOptionButton));
