import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { IconScreenshare } from '../../base/icons/svg';
import ContextMenuItem from '../../base/ui/components/web/ContextMenuItem';
import { NOTIFY_CLICK_MODE } from '../../toolbox/types';
import { IButtonProps } from '../../video-menu/types';
import { useSendToSecondScreen } from '../hooks.web';
import { ISecondScreenSource } from '../types';

interface IProps extends IButtonProps {

    /**
     * Button text class name.
     */
    className?: string;

    /**
     * Whether the icon should be hidden or not.
     */
    noIcon?: boolean;

    /**
     * Click handler executed aside from the main action.
     */
    onClick?: Function;

    /**
     * What to show on the second screen.
     */
    source: ISecondScreenSource;
}

/**
 * A context-menu entry that sends its source to a second screen, and takes it
 * off again once it is there. Renders nothing when the feature is unavailable,
 * so it can be added unconditionally to a menu.
 *
 * @param {IProps} props - The component props.
 * @returns {ReactElement | null}
 */
const SendToSecondScreenButton = ({
    className,
    noIcon = false,
    notifyClick,
    notifyMode,
    onClick,
    source
}: IProps) => {
    const { t } = useTranslation();
    const { active, onClick: sendToSecondScreen, visible } = useSendToSecondScreen(source);

    const _onClick = useCallback(() => {
        notifyClick?.();
        if (notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY) {
            return;
        }
        sendToSecondScreen();
        onClick?.();
    }, [ notifyClick, notifyMode, onClick, sendToSecondScreen ]);

    if (!visible) {
        return null;
    }

    const text = t(active ? 'multiScreen.removeFromSecondScreen' : 'multiScreen.sendToSecondScreen');

    return (
        <ContextMenuItem
            accessibilityLabel = { text }
            icon = { noIcon ? null : IconScreenshare }
            onClick = { _onClick }
            text = { text }
            textClassName = { className } />
    );
};

export default SendToSecondScreenButton;
