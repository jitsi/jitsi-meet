// @flow

import React, { useCallback } from 'react';

import { Container } from '../../react/base';
import { styleTypeToObject } from '../../styles';

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
     * Id of the icon container
     */
    containerId?: string,

    /**
     * Function to invoke on click.
     */
    onClick?: Function,

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
    style?: Object,

    /**
     * aria disabled flag for the Icon.
     */
    ariaDisabled?: boolean,

    /**
     * aria label for the Icon.
     */
    ariaLabel?: string,

    /**
     * whether the element has a popup
     */
    ariaHasPopup?: boolean,

    /**
     * whether the element has a pressed
     */
    ariaPressed?: boolean,

    /**
     * id of description label
     */
    ariaDescribedBy?: string,

    /**
     * whether the element popup is expanded
     */
    ariaExpanded?: boolean,

    /**
     * The id of the element this button icon controls
     */
    ariaControls?: string,

      /**
     * tabIndex  for the Icon.
     */
    tabIndex?: number,

     /**
     * role for the Icon.
     */
    role?: string,

    /**
     * keypress handler.
     */
    onKeyPress?: Function,

    /**
     * keydown handler.
     */
    onKeyDown?: Function
}

export const DEFAULT_COLOR = navigator.product === 'ReactNative' ? 'white' : undefined;
export const DEFAULT_SIZE = navigator.product === 'ReactNative' ? 36 : 22;

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
        containerId,
        onClick,
        size,
        src: IconComponent,
        style,
        ariaHasPopup,
        ariaLabel,
        ariaDisabled,
        ariaExpanded,
        ariaControls,
        tabIndex,
        ariaPressed,
        ariaDescribedBy,
        role,
        onKeyPress,
        onKeyDown,
        ...rest
    }: Props = props;

    const {
        color: styleColor,
        fontSize: styleSize,
        ...restStyle
    } = styleTypeToObject(style ?? {});
    const calculatedColor = color ?? styleColor ?? DEFAULT_COLOR;
    const calculatedSize = size ?? styleSize ?? DEFAULT_SIZE;

    const onKeyPressHandler = useCallback(e => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
            e.preventDefault();
            onClick(e);
        } else if (onKeyPress) {
            onKeyPress(e);
        }
    }, [ onClick, onKeyPress ]);

    return (
        <Container
            { ...rest }
            aria-controls = { ariaControls }
            aria-describedby = { ariaDescribedBy }
            aria-disabled = { ariaDisabled }
            aria-expanded = { ariaExpanded }
            aria-haspopup = { ariaHasPopup }
            aria-label = { ariaLabel }
            aria-pressed = { ariaPressed }
            className = { `jitsi-icon ${className || ''}` }
            id = { containerId }
            onClick = { onClick }
            onKeyDown = { onKeyDown }
            onKeyPress = { onKeyPressHandler }
            role = { role }
            style = { restStyle }
            tabIndex = { tabIndex }>
            <IconComponent
                fill = { calculatedColor }
                height = { calculatedSize }
                id = { id }
                width = { calculatedSize } />
        </Container>
    );
}

Icon.defaultProps = {
    className: ''
};
