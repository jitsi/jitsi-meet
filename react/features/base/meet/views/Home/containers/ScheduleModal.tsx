import { Button, Input, Modal } from "@internxt/ui";
import { Copy, X } from "@phosphor-icons/react";
import React, { useState } from "react";

interface ScheduleMeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onJoinNow: () => void;
    meetingLink: string;
    translate: (key: string) => string;
    errorMessage?: string | null;
}

const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({
    isOpen,
    onClose,
    onJoinNow,
    meetingLink,
    translate,
    errorMessage,
}) => {
    const [copied, setCopied] = useState(false);
    const inputAccent = errorMessage ? "error" : undefined;
    const inputErrorMessage = errorMessage ?? undefined;

    const handleCopy = () => {
        navigator.clipboard.writeText(meetingLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="p-0 w-[384px]" width="w-[384px]">
            <button onClick={onClose} className="absolute right-5 top-5 text-gray-100 hover:text-gray-700">
                <X size={24} />
            </button>
            <div className="p-5">
                <h1 className="text-2xl font-medium text-gray-100 mb-2">{translate("meet.modals.schedule.title")}</h1>
                <p className="text-lg text-gray-80 mb-6">{translate("meet.modals.schedule.subtitle")}</p>
                <p className="text-lg text-gray-80 mb-4">{translate("meet.modals.schedule.description")}</p>

                <div className="mb-2">
                    <label className="text-sm font-normal text-gray-80">
                        {translate("meet.modals.schedule.linkLabel")}
                    </label>
                </div>

                <div className="flex flex-col mb-4 relative">
                    <Input
                        value={meetingLink}
                        message={inputErrorMessage}
                        accent={inputAccent}
                        className="select-all text-lg font-normal"
                        inputClassName="pr-11 pl-3"
                    />
                    <button
                        onClick={handleCopy}
                        className="absolute right-1.5 top-1 h-8 w-8 rounded-full items-center justify-center flex hover:bg-[#0066FF1A] active:bg-[#0066FF40] transition-colors duration-200"
                    >
                        <Copy size={20} className="text-primary" color="#0066FF" />
                    </button>
                    {copied && (
                        <div className="absolute -top-10 right-0 bg-black/70 text-white px-3 py-1 rounded-md text-sm font-medium shadow-lg animate-fade-in">
                            {translate("meet.modals.schedule.copiedButton")}
                        </div>
                    )}
                </div>

                <div className="flex justify-end space-x-3 mt-4">
                    <Button onClick={onClose} variant="secondary" className="px-6 py-3">
                        {translate("meet.modals.schedule.cancelButton")}
                    </Button>
                    {!inputErrorMessage && (
                        <Button onClick={onJoinNow} variant="primary" className="px-6 py-3">
                            {translate("meet.modals.schedule.joinNow")}
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default ScheduleMeetingModal;
