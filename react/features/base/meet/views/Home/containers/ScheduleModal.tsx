import { Button, Input, Modal } from "@internxt/ui";
import { X } from "@phosphor-icons/react";
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
        <Modal isOpen={isOpen} onClose={onClose} className="p-0">
            <button onClick={onClose} className="absolute right-5 top-5 text-gray-100 hover:text-gray-700">
                <X size={24} />
            </button>
            <div className="p-5">
                <h1 className="text-3xl font-medium text-gray-100 mb-2">{translate("meet.modals.schedule.title")}</h1>
                <p className="text-lg text-gray-80 mb-6">{translate("meet.modals.schedule.subtitle")}</p>
                <p className="text-base text-gray-80 mb-4">{translate("meet.modals.schedule.description")}</p>

                <div className="mb-2">
                    <label className="text-sm font-medium text-gray-80">
                        {translate("meet.modals.schedule.linkLabel")}
                    </label>
                </div>

                <div className="flex flex-col space-y-3 mb-4">
                    <Input
                        value={meetingLink}
                        message={inputErrorMessage}
                        accent={inputAccent}
                        className="select-all"
                    />
                </div>

                <div className="flex justify-end space-x-3 mt-4">
                    <Button onClick={onClose} variant="secondary" className="px-6 py-3">
                        {translate("meet.modals.schedule.cancelButton")}
                    </Button>
                    {!inputErrorMessage && (
                        <>
                            <Button onClick={handleCopy} className="px-6 py-3">
                                {copied
                                    ? translate("meet.modals.schedule.copiedButton")
                                    : translate("meet.modals.schedule.copyButton")}
                            </Button>
                            <Button onClick={onJoinNow} variant="primary" className="px-6 py-3">
                                {translate("meet.modals.schedule.joinNow")}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default ScheduleMeetingModal;
