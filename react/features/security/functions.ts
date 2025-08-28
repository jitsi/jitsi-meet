/**
 * Returns true if the security dialog button should be visible and false otherwise.
 *
 * @param {Object} options - The parameters needed to determine the security dialog button visibility.
 * @returns {boolean}
 */
export function isSecurityDialogButtonVisible({
    conference,
    securityUIConfig,
    isModerator,
    enabledLobbyModeFlag,
    enabledSecurityOptionsFlag,
    enabledMeetingPassFlag
}: {
    conference: any;
    enabledLobbyModeFlag: boolean;
    enabledMeetingPassFlag: boolean;
    enabledSecurityOptionsFlag: boolean;
    isModerator: boolean;
    securityUIConfig: { hideLobbyButton?: boolean; };
}) {
    const { hideLobbyButton } = securityUIConfig;
    const lobbySupported = conference?.isLobbySupported();
    const lobby = lobbySupported && isModerator && !hideLobbyButton;


    return enabledSecurityOptionsFlag && ((enabledLobbyModeFlag && lobby) || enabledMeetingPassFlag);
}
