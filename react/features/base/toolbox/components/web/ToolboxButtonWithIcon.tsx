import React from 'react';

import { NOTIFY_CLICK_MODE } from '../../../../toolbox/constants';
import Icon from '../../../icons/components/Icon';
import Tooltip from '../../../tooltip/components/Tooltip';

interface IProps {

    /**
     * The id of the element this button icon controls.
     */
    ariaControls?: string;

    /**
     * Whether the element popup is expanded.
     */
    ariaExpanded?: boolean;

    /**
     * Whether the element has a popup.
     */
    ariaHasPopup?: boolean;

    /**
     * Aria label for the Icon.
     */
    ariaLabel?: string;

    /**
     * The button's key.
     */
    buttonKey?: string;

    /**
     * The decorated component (ToolboxButton).
     */
    children: React.ReactNode;

    /**
     * Icon of the button.
     */
    icon: Function;

    /**
     * Flag used for disabling the small icon.
     */
    iconDisabled: boolean;

    /**
     * The ID of the icon button.
     */
    iconId: string;

    /**
     * The tooltip used for the icon.
     */
    iconTooltip: string;

    /**
     * Notify mode for `toolbarButtonClicked` event -
     * whether to only notify or to also prevent button click routine.
     */
    notifyMode?: string;

    /**
     * Click handler for the small icon.
     */
    onIconClick: Function;

    /**
     * Keydown handler for icon.
     */
    onIconKeyDown?: Function;

    /**
     * Additional styles.
     */
    styles?: Object;
}

/**
 * Displays the `ToolboxButtonWithIcon` component.
 *
 * @param {Object} props - Component's props.
 * @returns {ReactElement}
 */
export default function ToolboxButtonWithIcon(props: IProps) {
    const {
        children,
        icon,
        iconDisabled,
        iconTooltip,
        buttonKey,
        notifyMode,
        onIconClick,
        onIconKeyDown,
        styles,
        ariaLabel,
        ariaHasPopup,
        ariaControls,
        ariaExpanded,
        iconId
    } = props;

    const iconProps: {
        ariaControls?: string;
        ariaExpanded?: boolean;
        containerId?: string;
        onClick?: (e?: React.MouseEvent) => void;
        onKeyDown?: Function;
        role?: string;
        tabIndex?: number;
    } = {};
    let className = '';

    if (iconDisabled) {
        className
            = 'settings-button-small-icon settings-button-small-icon--disabled';
    } else {
        className = 'settings-button-small-icon';
        iconProps.onClick = (e?: React.MouseEvent) => {
            if (typeof APP !== 'undefined' && notifyMode) {
                APP.API.notifyToolbarButtonClicked(
                    buttonKey, notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY
                );
            }

            if (notifyMode !== NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY) {
                onIconClick(e);
            }
        };
        iconProps.onKeyDown = onIconKeyDown;
        iconProps.role = 'button';
        iconProps.tabIndex = 0;
        iconProps.ariaControls = ariaControls;
        iconProps.ariaExpanded = ariaExpanded;
        iconProps.containerId = iconId;
    }


    return (
        <div
            className = 'settings-button-container'
            style = { styles }>
            {children}

            <div>
                <Tooltip
                    containerClassName = { className }
                    content = { iconTooltip }
                    position = 'top'>
                    <Icon
                        { ...iconProps }
                        ariaHasPopup = { ariaHasPopup }
                        ariaLabel = { ariaLabel }
                        size = { 16 }
                        src = { icon } />
                </Tooltip>
            </div>
        </div>
    );
}
