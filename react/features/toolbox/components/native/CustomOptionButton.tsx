import React from 'react';
import { Image } from 'react-native';
import { SvgCssUri } from 'react-native-svg';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';

import styles from './styles';


interface IProps extends AbstractButtonProps {
    icon: any;
    id?: string;
    text: string;
}

/**
 * Component that renders a custom button.
 *
 * @returns {Component}
 */
class CustomOptionButton extends AbstractButton<IProps> {
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
            iconComponent
                = (
                    <SvgCssUri
                        style = { styles.iconImageStyles }
                        uri = { this.iconSrc } />);
        } else {
            iconComponent
                = (
                    <Image
                        source = {{ uri: this.iconSrc }}
                        style = { styles.iconImageStyles }
                        tintColor = { 'white' } />);
        }

        return iconComponent;
    };

    label = this.text;
}

export default translate(connect()(CustomOptionButton));
