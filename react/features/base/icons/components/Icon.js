// @flow

import React from 'react';

import { styleTypeToObject } from '../../styles';

import { Container } from '../../react/base';

type Props = {

    /**
     * Class name for the web platform, if any.
     */
    className?: string,

    /**
     * Color of the icon (if not provided by the style object).
     */
    color?: string,

    /**
     * Id prop (mainly for autotests).
     */
    id?: string,

    /**
     * The size of the icon (if not provided by the style object).
     */
    size?: number | string,

    /**
     * The preloaded icon component to render.
     */
    src: Function,

    /**
     * Style object to be applied.
     */
    style?: Object
};

export const DEFAULT_COLOR = navigator.product === 'ReactNative' ? 'white' : undefined;
export const DEFAULT_SIZE = navigator.product === 'ReactNative' ? 36 : 24;

/**
 * Implements an Icon component that takes a loaded SVG file as prop and renders it as an icon.
 *
 * @param {Props} props - The props of the component.
 * @returns {Reactelement}
 */
export default function Icon(props: Props) {
    const {
        className,
        color,
        id,
        size,
        src: IconComponent,
        style
    } = props;

    const {
        color: styleColor,
        fontSize: styleSize,
        ...restStyle
    } = styleTypeToObject(style ?? {});
    const calculatedColor = color ?? styleColor ?? DEFAULT_COLOR;
    const calculatedSize = size ?? styleSize ?? DEFAULT_SIZE;

    return (
        <Container
            className = { className }
            style = { restStyle }>
            <IconComponent
                fill = { calculatedColor }
                height = { calculatedSize }
                id = { id }
                width = { calculatedSize } />
        </Container>
    );
}

