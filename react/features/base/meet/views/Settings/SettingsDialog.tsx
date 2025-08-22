import { Icon, X } from "@phosphor-icons/react";
import React, { ComponentType, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface TabConfig {
    id: string;
    label: string;
    icon: Icon;
    component: ComponentType<any>;
    props?: Record<string, any>;
    propsUpdateFunction?: (tabState: any, newProps: any, tabStates?: any[]) => Record<string, any>;
    submit?: (newState: any) => any;
    cancel?: () => any;
}

export interface SettingsDialogProps {
    tabs: TabConfig[];
    title: string;
    defaultTab?: string;
    onClose: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ tabs, title, defaultTab, onClose }) => {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
    const [tabStates, setTabStates] = useState<Record<string, any>>(() => {
        const initialStates: Record<string, any> = {};
        tabs.forEach((tab) => {
            initialStates[tab.id] = tab.props || {};
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

    const currentTab = useMemo(() => tabs.find((tab) => tab.id === activeTab), [tabs, activeTab]);

    const getTabProps = useCallback(
        (tab: TabConfig) => {
            const currentTabState = tabStates[tab.id];

            if (tab.propsUpdateFunction) {
                const tabStatesArray = tabs.map((t) => tabStates[t.id]);
                return tab.propsUpdateFunction(currentTabState || {}, tab.props || {}, tabStatesArray);
            }

            return {
                ...tab.props,
                ...currentTabState,
            };
        },
        [tabs, tabStates]
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
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
                        <div className="mb-1">
                            <span className="text-sm font-medium text-white mb-3 px-2">{t("settings.general")}</span>
                            <div className="space-y-1">
                                {tabs.slice(0, 3).map((tab) => {
                                    const isActive = tab.id === activeTab;

                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`
                                                w-full flex items-center gap-3 px-6 py-2.5
                                                rounded-lg transition-colors
                                                ${
                                                    isActive
                                                        ? "bg-primary/25 text-primary"
                                                        : "hover:bg-gray-700/50 text-gray-300 hover:text-white"
                                                }
                                            `}
                                        >
                                            <span className="font-medium text-sm">{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content area */}
                <div className="flex-1 flex flex-col border-l border-[#8C8C8C]">
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
                        {currentTab && (
                            <currentTab.component
                                {...getTabProps(currentTab)}
                                onTabStateChange={(tabId: number, newState: any) => {
                                    handleTabStateChange(currentTab.id, newState);
                                }}
                                tabId={tabs.findIndex((tab) => tab.id === currentTab.id)}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsDialog;
