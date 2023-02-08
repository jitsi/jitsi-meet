import React from 'react';

// eslint-disable-next-line lines-around-comment
// @ts-ignore
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';


type Props = AbstractButtonProps & {
    icon: string;
    text: string;
};

/**
 * Component that renders a custom toolbox button.
 *
 * @returns {Component}
 */
class CustomOptionButton extends AbstractButton<Props, any, any> {
    // @ts-ignore
    iconSrc = this.props.icon;

    // @ts-ignore
    id = this.props.id;

    // @ts-ignore
    text = this.props.text;

    accessibilityLabel = this.text;

    /**
     * Custom icon component.
     *
     * @param {any} props - Icon's props.
     * @returns {img}
     */
    icon = (props: any) => (<img
        src = { this.iconSrc }
        { ...props } />);

    label = this.text;
    tooltip = this.text;
}

export default CustomOptionButton;
