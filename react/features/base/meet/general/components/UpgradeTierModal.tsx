import { Button, Modal } from "@internxt/ui";
import { ArrowSquareOutIcon } from "@phosphor-icons/react";
import React from "react";
import { createPortal } from "react-dom";

export interface UpgradeTierModalProps {
    translate: (key: string) => string;
    onClose: () => void;
    show: boolean;
    info: {
        title: string;
        description: string;
    }
}

const UpgradeTierModal = ({
    translate,
    onClose,
    show,
    info,
}: UpgradeTierModalProps): React.ReactPortal | null => {
    const bodyElement = document.body;

    if (!bodyElement) {
        return null;
    }

    const onUpgradeClick = () => {
        window.open("https://internxt.com/pricing", "_blank", "noopener");
    };

    const modalContent = (
        <Modal onClose={onClose} isOpen={show} className="bg-gray-100 dark:bg-gray-1">
            <div className="p-5">
                <p className="text-xl dark:text-white font-semibold mb-6 px-1">
                    {info.title}
                </p>
                <p className="dark:text-gray-300 mb-10">{info.description}</p>

                <div className="mt-5 flex justify-end space-x-2">
                    <Button variant="secondary" onClick={onClose}>
                        {translate('upgradePlanDialog.cancel')}
                    </Button>
                    <Button variant="primary" onClick={onUpgradeClick} >
                        <span className="flex items-center">
                            {translate('upgradePlanDialog.upgrade')} <ArrowSquareOutIcon className="ml-1.5" weight="bold" />
                        </span>
                    </Button>
                </div>
            </div>
        </Modal>
    );

    return createPortal(modalContent, bodyElement);
};

export default UpgradeTierModal;
