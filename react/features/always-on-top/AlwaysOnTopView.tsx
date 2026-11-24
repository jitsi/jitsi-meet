import React, { ReactNode } from 'react';

// We need to reference these files directly to avoid loading things that are not available
// in this environment (e.g. JitsiMeetJS or interfaceConfig).
import StatelessAvatar from '../base/avatar/components/web/StatelessAvatar';
import { getAvatarColor, getInitials } from '../base/avatar/functions';
import { DEFAULT_ICON } from '../base/icons/svg/constants';

import Toolbar from './Toolbar';

/**
 * Props shared by the legacy Always-on-Top and dedicated Document PiP renderers.
 */
interface IProps {
    /** Participant avatar URL. */
    avatarURL: string;

    /** Optional renderer-owned media element. */
    children?: ReactNode;

    /** Configured avatar background palette. */
    customAvatarBackgrounds: string[];

    /** Participant display name used for initials and avatar hashing. */
    displayName: string;

    /** Display name formatted for presentation. */
    formattedDisplayName: string;

    /** Whether media is visible instead of the avatar fallback. */
    isVideoDisplayed: boolean;

    /** Pointer-leave handler used by toolbar visibility management. */
    onMouseOut: (event?: React.MouseEvent) => void;

    /** Pointer-enter handler used by toolbar visibility management. */
    onMouseOver: (event?: React.MouseEvent) => void;

    /** Whether the shared toolbar is visible. */
    toolbarVisible: boolean;
}

/**
 * Shared presentation used by the legacy and Document PiP always-on-top renderers.
 *
 * @returns {ReactElement}
 */
export default function AlwaysOnTopView({
    avatarURL,
    children,
    customAvatarBackgrounds,
    displayName,
    formattedDisplayName,
    isVideoDisplayed,
    onMouseOut,
    onMouseOver,
    toolbarVisible
}: IProps) {
    return (
        <div id = 'alwaysOnTop'>
            { children }
            <Toolbar
                className = { toolbarVisible ? 'fadeIn' : 'fadeOut' }
                onMouseOut = { onMouseOut }
                onMouseOver = { onMouseOver } />
            { !isVideoDisplayed && (
                <div id = 'videoNotAvailableScreen'>
                    <div id = 'avatarContainer'>
                        <StatelessAvatar
                            color = { getAvatarColor(displayName, customAvatarBackgrounds) }
                            iconUser = { DEFAULT_ICON.IconUser }
                            id = 'avatar'
                            initials = { getInitials(displayName) }
                            url = { avatarURL } />
                    </div>
                    <div
                        className = 'displayname'
                        id = 'displayname'>
                        { formattedDisplayName }
                    </div>
                </div>
            ) }
        </div>
    );
}
