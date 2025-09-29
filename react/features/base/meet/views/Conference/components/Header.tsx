import { Header as IntxHeader } from "@internxt/ui";
import { SquaresFour, UserFocus } from "@phosphor-icons/react";
import React from "react";
import ConferenceTimer from "./ConferenceTimer";

const LeftContent = React.memo(
    (): JSX.Element => (
        <div className="flex flex-row justify-center items-center rounded-2xl border bg-black/50 border-white/10">
            <div
                className="flex items-center space-x-2 h-12 px-3"
                style={{ paddingLeft: "12px", paddingRight: "12px" }}
            >
                <img src={"images/internxt_logo.png"} alt="logo" className="h-7" />
                <span className="text-lg font-semibold text-white" style={{ fontWeight: 600 }}>
                    Meet
                </span>
            </div>
            <div className="border-l-[1px] border-white/15 px-3">
                <div className="w-12">
                    <ConferenceTimer />
                </div>
            </div>
        </div>
    )
);

export type Mode = "speaker" | "gallery";
interface RightContentProps {
    mode: Mode;
    translate: Function;
    onSetModeClicked: (mode: Mode) => void;
}

const RightContent = React.memo(({ mode, translate, onSetModeClicked }: RightContentProps): JSX.Element => {
    const handleSetMode = () => {
        if (mode === "gallery") {
            onSetModeClicked("speaker");
        return;
        }

        onSetModeClicked("gallery");
    };

    return (
        <button
            onClick={handleSetMode}
            className="flex flex-row justify-center items-center space-x-2 p-[10px] bg-black/50 border border-white/10 rounded-2xl"
        >
           {mode === "gallery" ? <>
            <SquaresFour size={20} /> <span>{translate("meet.meeting.button.gallery")}</span>
           </>
           : <>
           <UserFocus size={20} /> <span>{translate("meet.meeting.button.speaker")}</span>
           </>}
        </button>
    );
});


interface HeaderProps {
    translate: Function;
    mode: Mode;
    onSetModeClicked: (mode: Mode) => void;
}

const Header = ({ mode, translate, onSetModeClicked }: HeaderProps) => (
    <IntxHeader
        leftContent={<LeftContent />}
        rightContent={<RightContent mode={mode} translate={translate} onSetModeClicked={onSetModeClicked} />}
        className="fixed top-0 left-0 right-0 p-3 z-[99]"
    />
);

export default Header;
