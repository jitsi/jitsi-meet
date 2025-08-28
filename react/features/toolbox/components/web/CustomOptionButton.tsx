import React from 'react';

import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';


interface IProps extends AbstractButtonProps {
    backgroundColor?: string;
    icon: string;
    id?: string;
    text: string;
}

/**
 * Component that renders a custom toolbox button.
 *
 * @returns {Component}
 */
class CustomOptionButton extends AbstractButton<IProps> {
    iconSrc = this.props.icon;
    id = this.props.id;
    text = this.props.text;
    override backgroundColor = this.props.backgroundColor;

    override accessibilityLabel = this.text;

    /**
     * Custom icon component.
     *
     * @param {any} props - Icon's props.
     * @returns {img}
     */
    override icon = (props: any) => (<img
        src = { this.iconSrc }
        { ...props } />);

    override label = this.text;
    override tooltip = this.text;
}

export default CustomOptionButton;
