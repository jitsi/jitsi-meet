import React, { useCallback, useEffect, useRef, useState } from 'react';

// We need to reference these files directly to avoid loading things that are not available
// in this environment (e.g. JitsiMeetJS or interfaceConfig)
import StatelessAvatar from '../base/avatar/components/web/StatelessAvatar';
import { getAvatarColor, getInitials } from '../base/avatar/functions';
import { DEFAULT_ICON } from '../base/icons/svg/constants';

import Toolbar from './Toolbar';

const { api } = window.alwaysOnTop!;

/**
 * The timeout in ms for hiding the toolbar.
 */
const TOOLBAR_TIMEOUT = 4000;

/**
 * Represents the always on top page.
 *
 * @returns {JSX.Element}
 */
const AlwaysOnTop = () => {
    const [ avatarURL, setAvatarURL ] = useState('');
    const [ customAvatarBackgrounds, setCustomAvatarBackgrounds ] = useState<string[]>([]);
    const [ displayName, setDisplayNameState ] = useState('');
    const [ formattedDisplayName, setFormattedDisplayName ] = useState('');
    const [ isVideoDisplayed, setIsVideoDisplayed ] = useState(true);
    const [ userID, setUserID ] = useState('');
    const [ visible, setVisible ] = useState(true);

    const hovered = useRef(false);
    const hideTimeoutRef = useRef<number | null>(null);

    const hideToolbarAfterTimeout = useCallback(() => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
        }

        hideTimeoutRef.current = window.setTimeout(
            () => {
                if (hovered.current) {
                    hideToolbarAfterTimeout();
                } else {
                    setVisible(false);
                }
            },
            TOOLBAR_TIMEOUT);
    }, []);

    const avatarChangedListener = useCallback(({ avatarURL: newAvatarURL, id }: { avatarURL: string; id: string; }) => {
        if (api._getOnStageParticipant() === id) {
            setAvatarURL(newAvatarURL);
        }
    }, []);

    const displayNameChangedListener = useCallback(({ displayname, formattedDisplayName: newFormattedDisplayName, id }: { displayname: string;
        formattedDisplayName: string; id: string; }) => {
        if (api._getOnStageParticipant() === id) {
            setDisplayNameState(displayname);
            setFormattedDisplayName(newFormattedDisplayName);
        }
    }, []);

    const videoChangedListener = useCallback(() => {
        const stageID = api._getOnStageParticipant();
        const stageAvatarURL = api.getAvatarURL(stageID);
        const stageDisplayName = api.getDisplayName(stageID);
        const stageFormattedDisplayName = api._getFormattedDisplayName(stageID);
        const stageIsVideoDisplayed = Boolean(api._getPrejoinVideo?.() || api._getLargeVideo());

        setAvatarURL(stageAvatarURL);
        setDisplayNameState(stageDisplayName);
        setFormattedDisplayName(stageFormattedDisplayName);
        setIsVideoDisplayed(stageIsVideoDisplayed);
        setUserID(stageID);
    }, []);

    const mouseMove = useCallback(() => {
        setVisible(prevVisible => {
            if (!prevVisible) {
                return true;
            }

            return prevVisible;
        });
    }, []);

    const onMouseOut = useCallback(() => {
        hovered.current = false;
    }, []);

    const onMouseOver = useCallback(() => {
        hovered.current = true;
    }, []);

    useEffect(() => {
        api.on('avatarChanged', avatarChangedListener);
        api.on('displayNameChange', displayNameChangedListener);
        api.on('largeVideoChanged', videoChangedListener);
        api.on('prejoinVideoChanged', videoChangedListener);
        api.on('videoConferenceJoined', videoChangedListener);

        videoChangedListener();

        window.addEventListener('mousemove', mouseMove);

        api.getCustomAvatarBackgrounds()
            .then((res: { avatarBackgrounds?: string[]; }) =>
                setCustomAvatarBackgrounds(res.avatarBackgrounds || []))
            .catch(console.error);

        return () => {
            api.removeListener('avatarChanged', avatarChangedListener);
            api.removeListener('displayNameChange', displayNameChangedListener);
            api.removeListener('largeVideoChanged', videoChangedListener);
            api.removeListener('prejoinVideoChanged', videoChangedListener);
            api.removeListener('videoConferenceJoined', videoChangedListener);

            window.removeEventListener('mousemove', mouseMove);
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (visible) {
            hideToolbarAfterTimeout();
        }
    }, [ visible, hideToolbarAfterTimeout ]);

    const renderVideoNotAvailableScreen = () => {
        if (isVideoDisplayed) {
            return null;
        }

        return (
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
        );
    };

    return (
        <div id = 'alwaysOnTop'>
            <Toolbar
                className = { visible ? 'fadeIn' : 'fadeOut' }
                onMouseOut = { onMouseOut }
                onMouseOver = { onMouseOver } />
            { renderVideoNotAvailableScreen() }
        </div>
    );
};

export default AlwaysOnTop;
