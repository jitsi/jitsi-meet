import { Avatar } from "@internxt/ui";
import React from "react";
import { MeetingUser } from "../../../services/types/meeting.types";

const ParticipantsList = ({
    participants,
    translate,
}: {
    participants: MeetingUser[];
    translate: (key: string) => string;
}) => {
    const participantsNumber = participants.length;
    return (
        <div className="flex flex-col items-center justify-center space-y-5">
            <div className="flex flex-col items-center justify-center">
                <span className="text-xl font-semibold text-white">{translate("meet.internxtMeet")}</span>

                <span className="text-base font-normal text-white/75">
                    {participantsNumber}{" "}
                    {participantsNumber === 1
                        ? translate("meet.preMeeting.participant")
                        : translate("meet.preMeeting.participants")}
                </span>
            </div>
            <div className="flex items-center">
                <div className="flex -space-x-3">
                    {participants.map((participant, index) => (
                        <div key={index} className="relative rounded-full bg-gray-90 dark:bg-gray-1 border border-white/15">
                            <Avatar
                                fullName={participant.name}
                                src={participant?.avatar}
                                size="sm"
                                className="bg-gray-90 dark:bg-gray-1 text-white"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ParticipantsList;
