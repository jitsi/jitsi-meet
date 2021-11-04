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
     * Id of the icon container.
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
     * Aria disabled flag for the Icon.
     */
    ariaDisabled?: boolean,

    /**
     * Aria label for the Icon.
     */
    ariaLabel?: string,

    /**
     * Whether the element has a popup.
     */
    ariaHasPopup?: boolean,

    /**
     * Whether the element has a pressed.
     */
    ariaPressed?: boolean,

    /**
     * Id of description label.
     */
    ariaDescribedBy?: string,

    /**
     * Whether the element popup is expanded.
     */
    ariaExpanded?: boolean,

    /**
     * The id of the element this button icon controls.
     */
    ariaControls?: string,

      /**
     * TabIndex  for the Icon.
     */
    tabIndex?: number,

     /**
     * Role for the Icon.
     */
    role?: string,

    /**
     * Keypress handler.
     */
    onKeyPress?: Function,

    /**
     * Keydown handler.
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

    const jitsiIconClassName = calculatedColor ? 'jitsi-icon' : 'jitsi-icon jitsi-icon-default';

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
            className = { `${jitsiIconClassName} ${className || ''}` }
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
