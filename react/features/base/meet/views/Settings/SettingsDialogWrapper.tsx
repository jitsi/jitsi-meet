import React, { useCallback, useMemo } from "react";
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

/**
 * Props for the wrapper component
 */
interface IProps {
    _tabs: TabConfig[];
    defaultTab: string;
    dispatch: IStore["dispatch"];
    isOpen: boolean;
    onClose: () => void;
}

const SettingsDialogWrapper: React.FC<IProps> = ({ _tabs, defaultTab, dispatch }) => {
    const onCloseHandler = useCallback(() => {
        dispatch(hideDialog());
    }, [dispatch]);

    const stableTabs = useMemo(() => _tabs, [_tabs]);

    return <SettingsDialog tabs={stableTabs} title="Settings" defaultTab={defaultTab} onClose={onCloseHandler} />;
};

/**
 * Maps Redux state to component props
 */
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
                    selectedVideoInputId: videoTabState?.selectedVideoInputId || newProps.selectedVideoInputId,
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

    return { _tabs: tabs };
}

export default connect(_mapStateToProps)(SettingsDialogWrapper);
