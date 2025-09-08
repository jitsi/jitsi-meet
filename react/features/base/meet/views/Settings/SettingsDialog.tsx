import { Icon, X } from "@phosphor-icons/react";
import React, { ComponentType, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface TabConfig {
    id: string;
    label: string;
    component?: ComponentType<any>;
    props?: Record<string, any>;
    propsUpdateFunction?: (tabState: any, newProps: any, tabStates?: any[]) => Record<string, any>;
    submit?: (newState: any) => any;
    cancel?: () => any;
    onClick?: () => void;
    Icon?: Icon;
}

export interface SettingsDialogProps {
    generalTabs: TabConfig[];
    accountTabs?: TabConfig[];
    title: string;
    defaultTab?: string;
    onClose: () => void;
    submit?: (tabStates: Record<string, any>) => void;
    cancel?: () => void;
    dispatch?: any;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({
    generalTabs,
    accountTabs = [],
    title,
    defaultTab,
    onClose,
    dispatch,
}) => {
    const allTabs = [...generalTabs, ...accountTabs];
    const [activeTab, setActiveTab] = useState(defaultTab ?? generalTabs[0]?.id);
    const [tabStates, setTabStates] = useState<Record<string, any>>(() => {
        const initialStates: Record<string, any> = {};
        allTabs.forEach((tab) => {
            initialStates[tab.id] = tab.props ?? {};
        });
        return initialStates;
    });
    const { t } = useTranslation();

    const handleTabStateChange = useCallback((tabId: string, newState: any) => {
        setTabStates((prev) => ({
            ...prev,
            [tabId]: newState,
        }));
    }, []);

    const currentTab = useMemo(() => allTabs.find((tab) => tab.id === activeTab), [allTabs, activeTab]);

    const handleTabClick = (tab: TabConfig) => {
        if (tab.onClick) {
            tab.onClick();
        } else {
            setActiveTab(tab.id);
        }
    };

    const getTabProps = useCallback(
        (tab: TabConfig) => {
            const currentTabState = tabStates[tab.id];

            if (tab.propsUpdateFunction) {
                const tabStatesArray = allTabs.map((t) => tabStates[t.id]);
                return tab.propsUpdateFunction(currentTabState ?? {}, tab.props ?? {}, tabStatesArray);
            }

            return {
                ...tab.props,
                ...currentTabState,
            };
        },
        [allTabs, tabStates]
    );

    return (
        <div className="fixed inset-0 z-[301] flex items-center justify-center bg-black/60">
            {/* Backdrop */}
            <div className="absolute inset-0" onClick={onClose} />

            {/* Dialog */}
            <div
                className={`
                    relative bg-[#111111] rounded-xl shadow-2xl
                    w-full max-w-5xl h-[650px]
                    flex overflow-hidden
                `}
            >
                {/* Sidebar - Tabs list */}
                <div className="flex flex-col w-56">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4">
                        <span className="text-xl font-semibold text-white">{title}</span>
                    </div>

                    {/* Tabs */}
                    <div className="flex-1 overflow-y-auto px-2.5 pb-4">
                        {/* General Category */}
                        {generalTabs.length > 0 && (
                            <div className="mb-6">
                                <span className="text-sm font-medium text-white mb-3 px-2 block">
                                    {t("settings.general")}
                                </span>
                                <div className="space-y-1">
                                    {generalTabs.map((tab) => {
                                        const isActive = tab.id === activeTab;

                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => handleTabClick(tab)}
                                                className={`
                                                    w-full flex items-center gap-3 px-6 py-2.5
                                                    rounded-lg transition-colors
                                                    ${
                                                        isActive
                                                            ? "bg-primary/25 text-primary"
                                                            : "hover:bg-primary/25 text-gray-300 hover:text-white"
                                                    }
                                                `}
                                            >
                                                <span className="font-medium text-sm">{tab.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Account Category */}
                        {accountTabs.length > 0 && (
                            <div className="mb-6">
                                <span className="text-sm font-medium text-white mb-3 px-2 block">
                                    {t("settings.account.title")}
                                </span>
                                <div className="space-y-1">
                                    {accountTabs.map((tab) => {
                                        const isActive = tab.id === activeTab;

                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => handleTabClick(tab)}
                                                className={`
                                                    w-full flex items-center gap-3 px-6 py-2.5
                                                    rounded-lg transition-colors
                                                    ${
                                                        isActive
                                                            ? "bg-primary/25 text-primary"
                                                            : "hover:bg-primary/25 text-gray-300 hover:text-white"
                                                    }
                                                `}
                                            >
                                                <span className="font-medium text-sm">{tab.label}</span>
                                                {tab.Icon && <tab.Icon size={24} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content area */}
                <div className="flex-1 flex flex-col border-l border-[#8C8C8C]/25">
                    {/* Content Header */}
                    <div className="px-6 py-4">
                        <span className="text-base font-medium text-white">{currentTab?.label}</span>
                        <button
                            onClick={onClose}
                            className="absolute right-5 top-4 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                            aria-label="Close dialog"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    {/* Tab content */}
                    <div className="flex-1 overflow-y-auto px-6 py-2">
                        {currentTab?.component && (
                            <currentTab.component
                                {...getTabProps(currentTab)}
                                onTabStateChange={(tabId: number, newState: any) => {
                                    handleTabStateChange(currentTab.id, newState);
                                    dispatch(currentTab?.submit?.(newState));
                                }}
                                tabId={allTabs.findIndex((tab) => tab.id === currentTab.id)}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsDialog;
