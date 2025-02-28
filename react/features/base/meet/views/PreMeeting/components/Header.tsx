import { Avatar, Button, Header as IntxHeader } from "@internxt/ui";
import React from "react";

const LeftContent = React.memo(
    (): JSX.Element => (
        <div className="rounded-2xl border bg-black/50 border-white/10 ">
            <div
                className="flex items-center space-x-2 h-12 px-3"
                style={{ paddingLeft: "12px", paddingRight: "12px" }}
            >
                <img src={"images/internxt_logo.png"} alt="logo" className="h-7" />
                <span className="text-lg font-semibold text-white" style={{ fontWeight: 600 }}>
                    Meet
                </span>
                <img src={"images/beta.png"} alt="logo" className="h-6" style={{ margin: "0px" }} />
            </div>
        </div>
    )
);

interface RightContentProps {
    isLogged: boolean;
    avatar: string | null;
    fullName?: string;
    translate: Function;
}

const RightContent = React.memo(({ isLogged, avatar, fullName, translate }: RightContentProps): JSX.Element => {
    const handleNewMeeting = () => {
        alert("Creating new meeting...");
    };

    const handleLogin = () => {
        alert("Redirecting to login...");
    };

    const handleSignUp = () => {
        alert("Redirecting to sign up...");
    };

    return isLogged ? (
        <div className="flex space-x-2 flex-row">
            <Button variant="primary" onClick={handleNewMeeting}>
                {translate("meet.preMeeting.newMeeting")}
            </Button>
            <Avatar src={avatar} fullName={fullName ?? ""} className="text-white" diameter={40} />
        </div>
    ) : (
        <div className="flex space-x-2 flex-row">
            {/* TODO: Change to secondary variant when dark mode works properly */}
            <Button variant="tertiary" onClick={handleLogin}>
                {translate("meet.login.login")}
            </Button>
            <Button variant="primary" onClick={handleSignUp}>
                {translate("meet.login.signUp")}
            </Button>
        </div>
    );
});

interface UserData {
    avatar: string | null;
    name: string;
    lastname: string;
    [key: string]: any;
}

interface HeaderProps {
    userData?: UserData | null;
    translate: Function;
}

const Header = ({ userData, translate }: HeaderProps) => (
    <IntxHeader
        leftContent={<LeftContent />}
        rightContent={
            <RightContent
                isLogged={!!userData}
                avatar={userData?.avatar ?? null}
                fullName={userData ? `${userData.name} ${userData.lastname}` : ""}
                translate={translate}
            />
        }
        className="z-50 py-3"
    />
);


export default Header;