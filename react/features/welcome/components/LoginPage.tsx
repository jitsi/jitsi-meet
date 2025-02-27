import React, { useEffect, useState } from "react";

import { Button } from "@internxt/ui";
import { AuthService } from "../../authentication/internxt/auth.service";
import { LoginCredentials } from "../../authentication/internxt/types/command.types";
import { ValidationService } from "../../authentication/internxt/validation.service";
import { get8x8BetaJWT } from "../../base/connection/options8x8";

const InternxtLogo = () => (
    <div
        style={{
            display: "flex",
            paddingLeft: "5rem",
            paddingTop: "2.5rem",
            paddingBottom: "2.5rem",
            justifyContent: "flex-start",
            flexDirection: "row",
            flexShrink: 0,
        }}
    >
        <svg
            fill="none"
            height="8"
            style={{ height: "auto", width: "7rem", color: "rgb(24 24 27)" }}
            viewBox="0 0 78 8"
            width="78"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M1.66857 8H0V0H1.66857V8Z" fill="currentColor" />
            <path
                d="M12.3242 5.50857V0H13.9813V8H12.2785L8.25562 2.48V8H6.58705V0H8.28991L12.3242 5.50857Z"
                fill="currentColor"
            />
            <path d="M18.2824 0H24.0081V1.47429H21.9738V8H20.3167V1.47429H18.2824V0Z" fill="currentColor" />
            <path
                d="M33.2134 0V1.47429H29.9677V3.18857H32.7677V4.66286H29.9677V6.52571H33.2134V8H28.2991V0H33.2134Z"
                fill="currentColor"
            />
            <path
                d="M44.3458 8H42.3229L40.0829 4.70857H39.5458V8H37.8772V0H41.1001C41.9229 0 42.5515 0.220952 42.9858 0.662857C43.4277 1.10476 43.6487 1.68381 43.6487 2.4C43.6487 3.56571 43.0696 4.2781 41.9115 4.53714L44.3458 8ZM39.5458 3.34857H40.8601C41.2258 3.34857 41.5039 3.27619 41.6944 3.13143C41.8925 2.97905 41.9915 2.73524 41.9915 2.4C41.9915 2.07238 41.8925 1.83619 41.6944 1.69143C41.5039 1.54667 41.2258 1.47429 40.8601 1.47429H39.5458V3.34857Z"
                fill="currentColor"
            />
            <path
                d="M54.3979 5.50857V0H56.055V8H54.3521L50.3293 2.48V8H48.6607V0H50.3636L54.3979 5.50857Z"
                fill="currentColor"
            />
            <path
                d="M64.8818 3.87429L67.6475 8H65.7275L63.9789 5.25714L62.2418 8H60.3332L63.0875 3.88571L60.4818 0H62.3789L63.9789 2.50286L65.5904 0H67.4989L64.8818 3.87429Z"
                fill="currentColor"
            />
            <path d="M71.307 0H77.0327V1.47429H74.9984V8H73.3412V1.47429H71.307V0Z" fill="currentColor" />
        </svg>
    </div>
);

const Login = (props: { _updateInxtToken: (token: string) => void }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [globalError, setGlobalError] = useState("");
    const [twoFactorCode, setTwoFactorCode] = useState<string | undefined>(undefined);
    const [enableTwoFactorCode, setEnableTwoFactorCode] = useState(false);
    const [twoFactorCodeError, setTwoFactorCodeError] = useState("");
    const [checkingCredentials, setCheckingCredentials] = useState(false);

    useEffect(() => {
        setEmailError("");
        setPasswordError("");
        setTwoFactorCodeError("");
        setGlobalError("");
        setEnableTwoFactorCode(false);
        setTwoFactorCode(undefined);
    }, [email]);

    const onButtonClick = async () => {
        // Set initial error values to empty
        setEmailError("");
        setPasswordError("");
        setTwoFactorCodeError("");
        setGlobalError("");
        setCheckingCredentials(true);

        // Check if the user has entered all fields correctly
        if (email.trim().length <= 0) {
            setEmailError("Please enter your email");
            setCheckingCredentials(false);

            return;
        }

        if (!ValidationService.instance.validateEmail(email)) {
            setEmailError("Please enter a valid email");
            setCheckingCredentials(false);

            return;
        }

        if (password.trim().length <= 0) {
            setPasswordError("Please enter a password");
            setCheckingCredentials(false);

            return;
        }

        const is2FANeeded = await AuthService.instance.is2FANeeded(email);

        if (is2FANeeded) {
            if (!enableTwoFactorCode) {
                setEnableTwoFactorCode(true);
                setCheckingCredentials(false);

                return;
            }
            if (!twoFactorCode || !ValidationService.instance.validate2FA(twoFactorCode)) {
                setTwoFactorCodeError("Please enter a valid two factor auth code (6 digit number)");
                setCheckingCredentials(false);

                return;
            }
        } else {
            setEnableTwoFactorCode(false);
        }

        let loginCredentials: LoginCredentials;

        try {
            loginCredentials = await AuthService.instance.doLogin(email, password, twoFactorCode);
        } catch (err) {
            setGlobalError("Wrong credentials, please try again");
            setCheckingCredentials(false);

            return;
        }

        if (loginCredentials?.newToken && loginCredentials?.user) {
            let meetTokenCreator;

            try {
                meetTokenCreator = await get8x8BetaJWT(loginCredentials.newToken);
            } catch (err) {
                setGlobalError("User can not create meetings");
                setCheckingCredentials(false);

                return;
            }

            if (meetTokenCreator?.token && meetTokenCreator?.room) {
                localStorage.setItem("xToken", loginCredentials.token);
                localStorage.setItem("xMnemonic", loginCredentials.mnemonic);
                localStorage.setItem("xNewToken", loginCredentials.newToken);
                localStorage.setItem("xUser", JSON.stringify(loginCredentials.user));

                props._updateInxtToken(loginCredentials.newToken);
            } else {
                setGlobalError("User can not create meetings");
            }
        } else {
            setGlobalError("Wrong credentials, please try again");
        }
        setCheckingCredentials(false);
    };

    return (
        <div className="mainContainer">
            <InternxtLogo />
            <div className="flex items-center justify-center h-full w-full flex-col">
                <div className="max-w-md px-4">
                    <div className="titleContainer">
                        <div style={{ color: "black" }}>Log in</div>
                    </div>
                    <br />
                    <div className="flex flex-col items-start justify-center">
                        <input
                            className="inputBox"
                            onChange={(ev) => setEmail(ev.target.value)}
                            placeholder="Email"
                            value={email}
                        />
                        <label className="text-red text-xs">{emailError}</label>
                    </div>
                    <br />
                    <div>
                        <input
                            className="inputBox"
                            onChange={(ev) => setPassword(ev.target.value)}
                            placeholder="Password"
                            type="password"
                            value={password}
                        />
                        <label className="text-red text-xs">{passwordError}</label>
                    </div>
                    {enableTwoFactorCode && (
                        <>
                            <br />
                            <div className="inputContainer">
                                <input
                                    className="inputBox"
                                    onChange={(ev) => setTwoFactorCode(ev.target.value)}
                                    placeholder="Two Factor Code"
                                    type="text"
                                    value={twoFactorCode}
                                />
                                <label className="text-red text-xs">{twoFactorCodeError}</label>
                            </div>
                        </>
                    )}
                    <br />
                    <div className="w-full max-w-md flex flex-col">
                        <Button
                            variant="primary"
                            loading={checkingCredentials}
                            disabled={checkingCredentials}
                            onClick={onButtonClick}
                            type="submit"
                        >
                            Log in
                        </Button>
                        <label className="text-red text-xs">{globalError}</label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
