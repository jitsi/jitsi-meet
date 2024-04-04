import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import Icon from '../../../base/icons/components/Icon';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';


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
     * @param {any} props - Icon's props.
     * @returns {img}
     */
    icon = (props: any) => (
        <Icon
            { ...props }
            size = { 24 }
            src = { this.iconSrc } />
    );

    label = this.text;
}

export default translate(connect()(CustomOptionButton));
