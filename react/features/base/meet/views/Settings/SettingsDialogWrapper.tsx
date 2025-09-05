import { ArrowSquareOut } from "@phosphor-icons/react";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { connect } from "react-redux";
import { IReduxState, IStore } from "../../../../app/types";
import { submitAudioDeviceSelectionTab, submitVideoDeviceSelectionTab } from "../../../../device-selection/actions.web";
import AudioDevicesSelection from "../../../../device-selection/components/AudioDevicesSelection.web";
import VideoDeviceSelection from "../../../../device-selection/components/VideoDeviceSelection.web";
import {
    getAudioDeviceSelectionDialogProps,
    getVideoDeviceSelectionDialogProps,
} from "../../../../device-selection/functions.web";
import { submitVirtualBackgroundTab } from "../../../../settings/actions.web";
import VirtualBackgroundTab from "../../../../settings/components/web/VirtualBackgroundTab";
import { SETTINGS_TABS } from "../../../../settings/constants";
import { getVirtualBackgroundTabProps } from "../../../../settings/functions.web";
import { checkBlurSupport, checkVirtualBackgroundEnabled } from "../../../../virtual-background/functions";
import { iAmVisitor } from "../../../../visitors/functions";
import { hideDialog } from "../../../dialog/actions";
import SettingsDialog, { TabConfig } from "./SettingsDialog";

interface IProps {
    generalTabs: TabConfig[];
    defaultTab: string;
    dispatch: IStore["dispatch"];
}
const EXTERNAL_ACCOUNT_URL = "https://drive.internxt.com/?preferences=open&section=account&subsection=account";

const SettingsDialogWrapper: React.FC<IProps> = ({ generalTabs, defaultTab, dispatch }) => {
    const { t } = useTranslation();
    const onCloseHandler = useCallback(() => {
        dispatch(hideDialog());
    }, [dispatch]);

    const generalTabsMem = useMemo(() => generalTabs, [generalTabs]);
    const accountTabs: TabConfig[] = [
        {
            id: "manage-account",
            label: t("settings.account.manage"),
            onClick: () => window.open(EXTERNAL_ACCOUNT_URL, "_blank", "noopener,noreferrer"),
            Icon: ArrowSquareOut,
        },
    ];

    return (
        <SettingsDialog
            generalTabs={generalTabsMem}
            accountTabs={accountTabs}
            title={t("settings.title")}
            defaultTab={defaultTab}
            onClose={onCloseHandler}
            dispatch={dispatch}
        />
    );
};

function _mapStateToProps(state: IReduxState, ownProps: any) {
    const { isDisplayedOnWelcomePage } = ownProps;
    const configuredTabs = interfaceConfig.SETTINGS_SECTIONS ?? [];

    const showDeviceSettings = configuredTabs.includes("devices");
    const virtualBackgroundSupported = checkBlurSupport();
    const enableVirtualBackground = checkVirtualBackgroundEnabled(state);

    const tabs: TabConfig[] = [];
    const _iAmVisitor = iAmVisitor(state);

    // Audio Tab
    if (showDeviceSettings) {
        tabs.push({
            id: SETTINGS_TABS.AUDIO,
            label: "Audio",
            component: AudioDevicesSelection,
            props: getAudioDeviceSelectionDialogProps(state, isDisplayedOnWelcomePage),
            propsUpdateFunction: (tabState: any, newProps: ReturnType<typeof getAudioDeviceSelectionDialogProps>) => {
                return {
                    ...newProps,
                    noiseSuppressionEnabled: tabState.noiseSuppressionEnabled,
                    selectedAudioInputId: tabState.selectedAudioInputId,
                    selectedAudioOutputId: tabState.selectedAudioOutputId,
                };
            },
            submit: (newState: any) => submitAudioDeviceSelectionTab(newState, isDisplayedOnWelcomePage),
        });

        // Video Tab
        !_iAmVisitor &&
            tabs.push({
                id: SETTINGS_TABS.VIDEO,
                label: "Video",
                component: VideoDeviceSelection,
                props: getVideoDeviceSelectionDialogProps(state, isDisplayedOnWelcomePage),
                propsUpdateFunction: (
                    tabState: any,
                    newProps: ReturnType<typeof getVideoDeviceSelectionDialogProps>
                ) => {
                    return {
                        ...newProps,
                        currentFramerate: tabState?.currentFramerate,
                        localFlipX: tabState.localFlipX,
                        selectedVideoInputId: tabState.selectedVideoInputId,
                    };
                },
                submit: (newState: any) => submitVideoDeviceSelectionTab(newState, isDisplayedOnWelcomePage),
            });
    }

    // Virtual Background Tab
    if (virtualBackgroundSupported && !_iAmVisitor && enableVirtualBackground) {
        tabs.push({
            id: SETTINGS_TABS.VIRTUAL_BACKGROUND,
            label: "Background",
            component: VirtualBackgroundTab,
            props: getVirtualBackgroundTabProps(state, isDisplayedOnWelcomePage),
            propsUpdateFunction: (
                tabState: any,
                newProps: ReturnType<typeof getVirtualBackgroundTabProps>,
                tabStates?: any[]
            ) => {
                const videoTabIndex = tabs.findIndex((tab) => tab.id === SETTINGS_TABS.VIDEO);
                const videoTabState = tabStates?.[videoTabIndex];
                return {
                    ...newProps,
                    selectedVideoInputId: videoTabState?.selectedVideoInputId ?? newProps.selectedVideoInputId,
                    options: tabState.options,
                };
            },
            submit: (newState: any) => submitVirtualBackgroundTab(newState),
            cancel: () => {
                const { options } = getVirtualBackgroundTabProps(state, isDisplayedOnWelcomePage);
                return submitVirtualBackgroundTab({ options }, true);
            },
        });
    }

    return { generalTabs: tabs };
}

export default connect(_mapStateToProps)(SettingsDialogWrapper);
