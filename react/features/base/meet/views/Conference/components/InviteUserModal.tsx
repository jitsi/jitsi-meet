import { Button, TransparentModal } from "@internxt/ui";
import { Check, Link, X } from "@phosphor-icons/react";
import React, { useState } from "react";
import { getDecodedURI } from "../../../../util/uri";
import { MAX_SIZE_PARTICIPANTS } from "../../../constants";

interface InviteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    translate: Function;
    participantsCount: Number;
    inviteUrl: string;
}

const InviteUserModal = ({ isOpen, onClose, translate, participantsCount, inviteUrl }: InviteUserModalProps) => {
    const [copied, setCopied] = useState(false);
    const inviteLink = inviteUrl && getDecodedURI(inviteUrl);

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);

        setTimeout(() => {
            setCopied(false);
        }, 2000);
    };

    return (
        <TransparentModal
            className={"flex p-7 bg-black/50 border border-white/15 rounded-[20px] z-[9999]"}
            isOpen={isOpen}
            onClose={onClose}
        >
            <div className="flex flex-col h-full w-[264px] text-white space-y-4">
                <button
                    onClick={onClose}
                    className="absolute right-5 top-4 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                    aria-label="Close dialog"
                >
                    <X className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-center justify-center">
                    <span className="text-xl font-semibold text-white "> {translate("meet.invite.invitePeople")}</span>

                    <span className="text-base font-normal text-white/75">
                        {participantsCount} / {MAX_SIZE_PARTICIPANTS} {translate("meet.invite.participants")}
                    </span>
                </div>
                {participantsCount === MAX_SIZE_PARTICIPANTS && (
                    <div className="bg-red/50 text-white text-sm rounded-lg px-3 py-1 mt-2 text-center w-fit mx-auto">
                        {translate("meet.invite.meetingFull")}
                    </div>
                )}

                <div className="space-y-4 pt-3">
                    <div className="relative w-full">
                        <Link className="absolute left-3 top-1/2 transform -translate-y-1/2" size={20} color="gray" />
                        <input
                            type="text"
                            value={inviteLink}
                            readOnly
                            disabled
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-1 rounded-lg border border-gray-600 focus:outline-none select-none pointer-events-none"
                        />
                    </div>
                    <Button
                        className={`w-full ${copied ? "bg-green-600" : ""}`}
                        onClick={handleCopy}
                        disabled={participantsCount === MAX_SIZE_PARTICIPANTS}
                    >
                        {copied ? (
                            <div className="flex items-center justify-center">
                                <Check size={18} className="mr-1" />
                                {translate("meet.invite.copied")}
                            </div>
                        ) : (
                            translate("meet.invite.copyLink")
                        )}
                    </Button>
                </div>
            </div>
        </TransparentModal>
    );
};

export default InviteUserModal;
