import { InfoIcon, XIcon } from '@phosphor-icons/react';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { isFileSharingEnabled } from '../../../file-sharing/functions.any';
import { toggleChat } from '../../actions.web';
import { ChatTabs } from '../../constants';

interface IProps {

    /**
     * An optional class name.
     */
    className: string;

    /**
     * Whether CC tab is enabled or not.
     */
    isCCTabEnabled: boolean;

    /**
     * Whether the polls feature is enabled or not.
     */
    isPollsEnabled: boolean;

    /**
     * Function to be called when pressing the close button.
     */
    onCancel: Function;

    /**
     * Function to be called when pressing the info button.
     */
    onShowBanner?: Function;
}

/**
 * Custom header of the {@code ChatDialog}.
 *
 * @returns {React$Element<any>}
 */
function ChatHeader({ className, isCCTabEnabled, isPollsEnabled, onShowBanner }: IProps) {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const { focusedTab } = useSelector((state: IReduxState) => state['features/chat']);
    const fileSharingTabEnabled = useSelector(isFileSharingEnabled);
    const [showTooltip, setShowTooltip] = React.useState(false);
    const [tooltipPosition, setTooltipPosition] = React.useState({ top: 0, left: 0 });
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    const handleMouseEnter = useCallback(() => {
        const TOP_OFFSET = 8;
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setTooltipPosition({
                top: rect.bottom + TOP_OFFSET,
                left: rect.left + rect.width / 2,
            });
        }
        setShowTooltip(true);
    }, []);

    const onCancel = useCallback(() => {
        dispatch(toggleChat());
    }, []);

    const onKeyPressHandler = useCallback(e => {
        if (onCancel && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            onCancel();
        }
    }, []);

    let title = 'chat.title';

    if (focusedTab === ChatTabs.CHAT) {
        title = 'chat.tabs.chat';
    } else if (isPollsEnabled && focusedTab === ChatTabs.POLLS) {
        title = 'chat.tabs.polls';
    } else if (isCCTabEnabled && focusedTab === ChatTabs.CLOSED_CAPTIONS) {
        title = 'chat.tabs.closedCaptions';
    } else if (fileSharingTabEnabled && focusedTab === ChatTabs.FILE_SHARING) {
        title = 'chat.tabs.fileSharing';
    }

    return (
        <div
            className="flex items-center justify-between mx-4 pt-4 pb-2 bg-black border-b border-[#474747] rounded-t-xl"
        >
            <div className="flex items-center gap-3">
                <span aria-level={1} role="heading" className="text-lg font-semibold text-white m-0">
                    {t(title)}
                </span>
                <button
                    ref={buttonRef}
                    onClick={() => onShowBanner?.()}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={() => setShowTooltip(false)}
                    aria-label="Chat info"
                    className="bg-transparent border-none cursor-pointer p-1 flex items-center"
                >
                    <InfoIcon size={20} weight="regular" />
                </button>
                {showTooltip && (
                    <div
                        className="fixed z-[9999]"
                        style={{
                            top: `${tooltipPosition.top}px`,
                            left: `${tooltipPosition.left}px`,
                            transform: 'translateX(-50%)'
                        }}
                    >
                        <div className="relative bg-white rounded-lg shadow-lg px-3 py-2 w-48">
                            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45"></div>
                            <p className="text-sm font-normal text-black relative z-10">
                                {t('chat.privacyTooltip')}
                            </p>
                        </div>
                    </div>
                )}
            </div>
            <button
                aria-label={t("toolbar.closeChat")}
                onClick={onCancel}
                onKeyPress={onKeyPressHandler}
                role="button"
                tabIndex={0}
                className="bg-transparent border-none cursor-pointer p-1 flex items-center text-white"
            >
                <XIcon size={24} weight="regular" />
            </button>
        </div>
    );
}

export default ChatHeader;
