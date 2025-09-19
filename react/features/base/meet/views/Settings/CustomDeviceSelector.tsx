import { CaretDown, Check } from "@phosphor-icons/react";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * The type of the React {@code Component} props of {@link DeviceSelector}.
 */
interface IProps {
    /**
     * MediaDeviceInfos used for display in the select element.
     */
    devices: Array<MediaDeviceInfo> | undefined;
    /**
     * If false, will return a selector with no selection options.
     */
    hasPermission: boolean;
    /**
     * CSS class for the icon to the left of the dropdown trigger.
     */
    icon: string;
    /**
     * The id of the dropdown element.
     */
    id: string;
    /**
     * If true, will render the selector disabled with a default selection.
     */
    isDisabled: boolean;
    /**
     * The translation key to display as a menu label.
     */
    label: string;
    /**
     * The callback to invoke when a selection is made.
     */
    onSelect: Function;
    /**
     * The default device to display as selected.
     */
    selectedDeviceId: string;
}

const DeviceSelector = ({ devices, hasPermission, id, isDisabled, label, onSelect, selectedDeviceId }: IProps) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const _onSelect = useCallback(
        (deviceId: string) => {
            if (selectedDeviceId !== deviceId) {
                onSelect(deviceId);
            }
            setIsOpen(false);
        },
        [selectedDeviceId, onSelect]
    );

    const _createDropdown = (options: {
        defaultSelected?: MediaDeviceInfo;
        isDisabled: boolean;
        items?: Array<{ label: string; value: string }>;
        placeholder: string;
    }) => {
        const triggerText =
            (options.defaultSelected && (options.defaultSelected.label || options.defaultSelected.deviceId)) ||
            options.placeholder;

        if (options.isDisabled || !options.items?.length) {
            return (
                <div className="flex flex-grow flex-col bg-gray-800 rounded-lg text-gray-400 text-sm">
                    <label className="block text-lg font-medium text-gray-300 mb-4">{t(label)}</label>
                    <div className="text-gray-400 h-10 flex items-center text-lg px-2">
                        <p>{triggerText}</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="relative flex flex-col flex-grow">
                <label className="block text-lg font-medium text-gray-300 mb-4">{t(label)}</label>

                {/* Trigger button */}
                <button
                    type="button"
                    id={id}
                    onClick={() => !isDisabled && setIsOpen(!isOpen)}
                    disabled={isDisabled}
                    className={`
                        relative w-full h-10 bg-[#1C1C1C80] border rounded-lg px-4
                        text-left text-white text-base font-medium
                        transition-all duration-200 ease-in-out box-border
                        flex items-center justify-between
                        ${isOpen ? "ring-2 ring-blue-500 border-[#72AAFF]" : "border-[#8C8C8C]"}
                    `}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                >
                    <span className="block truncate">{triggerText}</span>
                    <CaretDown
                        className={`h-6 w-6 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${
                            isOpen ? "rotate-180" : ""
                        }`}
                        aria-hidden="true"
                    />
                </button>

                {/* Dropdown menu */}
                {isOpen && options.items && (
                    <>
                        {/* Backdrop para cerrar el dropdown */}
                        <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

                        {/* Menu options */}
                        <div className="absolute top-full z-20 mt-1 w-full bg-[#2C2C30] rounded-lg shadow-lg max-h-60 overflow-auto">
                            <ul role="listbox" className="py-1">
                                {options.items.map((item) => (
                                    <li
                                        key={item.value}
                                        role="option"
                                        aria-selected={item.value === selectedDeviceId}
                                        onClick={() => _onSelect(item.value)}
                                        className={`
                                            relative cursor-pointer select-none py-3 px-4 text-sm
                                            transition-colors duration-150 ease-in-out
                                            ${
                                                item.value === selectedDeviceId
                                                    ? "bg-[#5C5C5C80] text-white"
                                                    : "text-gray-200 hover:bg-[#5C5C5C80] hover:text-white"
                                            }
                                        `}
                                    >
                                        <div className="flex items-center">
                                            <div className="w-4 h-4 mr-3 flex-shrink-0 flex items-center justify-center">
                                                {item.value === selectedDeviceId && <Check className="h-4 w-4" />}
                                            </div>
                                            <span className="block truncate font-medium">{item.label}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </>
                )}
            </div>
        );
    };

    const _renderNoDevices = () =>
        _createDropdown({
            isDisabled: true,
            placeholder: t("settings.noDevice"),
        });

    const _renderNoPermission = () =>
        _createDropdown({
            isDisabled: true,
            placeholder: t("deviceSelection.noPermission"),
        });

    if (hasPermission === undefined) {
        return null;
    }

    if (!hasPermission) {
        return _renderNoPermission();
    }

    if (!devices?.length) {
        return _renderNoDevices();
    }

    const items = devices.map((device) => {
        return {
            value: device.deviceId,
            label: device.label || device.deviceId,
        };
    });

    const defaultSelected = devices.find((item) => item.deviceId === selectedDeviceId);

    return _createDropdown({
        defaultSelected,
        isDisabled,
        items,
        placeholder: t("deviceSelection.selectADevice"),
    });
};

export default DeviceSelector;
