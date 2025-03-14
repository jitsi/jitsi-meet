import React from "react";
import { Button, TransparentModal } from "@internxt/ui";
import { getDecodedURI } from "../../../../util/uri";
import { Link } from "@phosphor-icons/react";
import { MAX_SIZE_PARTICIPANTS } from "../../../constants";

interface InviteUserProps {
    isOpen: boolean;
    onClose: () => void;
    translate: Function;
    participantsCount: Number;
    inviteUrl: string;
}

const InviteUser = ({ isOpen, onClose, translate, participantsCount, inviteUrl }: InviteUserProps) => {
    const inviteLink = inviteUrl && getDecodedURI(inviteUrl);

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink);
    };

    return (
        <TransparentModal
            className={"flex p-7 bg-black/50 border border-white/15 rounded-[20px]"}
            isOpen={isOpen}
            onClose={onClose}
        >
            <div className="flex flex-col h-full w-[264px] text-white space-y-4">
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

                <div className="space-y-4 pt-6">
                    <div className="relative w-full">
                        <Link className="absolute left-3 top-1/2 transform -translate-y-1/2" size={20} color="gray" />
                        <input
                            type="text"
                            value={inviteLink}
                            readOnly
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg border border-gray-600 focus:outline-none"
                        />
                    </div>
                    <Button className="w-full" onClick={handleCopy}>
                        {translate("meet.invite.copyLink")}
                    </Button>
                </div>
            </div>
        </TransparentModal>
    );
};

export default InviteUser;
