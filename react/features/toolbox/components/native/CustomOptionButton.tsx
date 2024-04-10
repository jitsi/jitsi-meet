import React from 'react';
import { Image } from 'react-native';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import AbstractButton, { IProps as AbstractButtonProps }
    from '../../../base/toolbox/components/AbstractButton';

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
    icon = () => (
        <Image
            source = {{ uri: this.iconSrc }}
            style = { styles.iconImageStyles } />
    );

    label = this.text;
}

export default translate(connect()(CustomOptionButton));
