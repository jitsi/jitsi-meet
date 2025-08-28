import React, { useCallback } from 'react';

import Button from '../../../base/ui/components/web/Button';
import { NOTIFY_CLICK_MODE } from '../../types';


/**
 * The type of the React {@code Component} props of {@link HangupContextMenuItem}.
 */
interface IProps {

    /**
     * Accessibility label for the button.
     */
    accessibilityLabel: string;

    /**
     * Key to use for toolbarButtonClicked event.
     */
    buttonKey: string;

    /**
     * Type of button to display.
     */
    buttonType: string;

    /**
     * Text associated with the button.
     */
    label: string;

    /**
     * Notify mode for `toolbarButtonClicked` event -
     * whether to only notify or to also prevent button click routine.
     */
    notifyMode?: string;

    /**
     * Callback that performs the actual hangup action.
     */
    onClick: Function;
}

/**
 * Implementation of a button to be rendered within Hangup context menu.
 *
 * @param {Object} props - Component's props.
 * @returns {JSX.Element} - Button that would trigger the hangup action.
 */
export const HangupContextMenuItem = (props: IProps) => {
    const shouldNotify = props.notifyMode !== undefined;
    const shouldPreventExecution = props.notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY;

    const _onClick = useCallback(() => {
        if (shouldNotify) {
            APP.API.notifyToolbarButtonClicked(props.buttonKey, shouldPreventExecution);
        }

        if (!shouldPreventExecution) {
            props.onClick();
        }
    }, []);

    return (
        <Button
            accessibilityLabel = { props.accessibilityLabel }
            fullWidth = { true }
            label = { props.label }
            onClick = { _onClick }
            type = { props.buttonType } />
    );
};

