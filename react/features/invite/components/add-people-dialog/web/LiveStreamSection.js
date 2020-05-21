// @flow

import React, { useState } from 'react';

import { translate } from '../../../../base/i18n';
import { Icon, IconCheck, IconCopy } from '../../../../base/icons';

import { copyText } from './utils';

type Props = {

    /**
     * The current known URL for a live stream in progress.
     */
    liveStreamViewURL: string,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
}

/**
 * Section of the {@code AddPeopleDialog} that renders the
 * live streaming url, allowing a copy action.
 *
 * @returns {React$Element<any>}
 */
function LiveStreamSection({ liveStreamViewURL, t }: Props) {
    const [ isClicked, setIsClicked ] = useState(false);
    const [ isHovered, setIsHovered ] = useState(false);

    /**
     * Click handler for the element.
     *
     * @returns {void}
     */
    function onClick() {
        setIsHovered(false);
        if (copyText(liveStreamViewURL)) {
            setIsClicked(true);

            setTimeout(() => {
                setIsClicked(false);
            }, 2500);
        }
    }

    /**
     * Hover handler for the element.
     *
     * @returns {void}
     */
    function onHoverIn() {
        if (!isClicked) {
            setIsHovered(true);
        }
    }

    /**
     * Hover handler for the element.
     *
     * @returns {void}
     */
    function onHoverOut() {
        setIsHovered(false);
    }

    /**
     * Renders the content of the link based on the state.
     *
     * @returns {React$Element<any>}
     */
    function renderLinkContent() {
        if (isClicked) {
            return (
                <>
                    <div className = 'invite-more-dialog stream-text selected'>
                        {t('addPeople.linkCopied')}
                    </div>
                    <Icon src = { IconCheck } />
                </>
            );
        }

        return (
            <>
                <div className = 'invite-more-dialog stream-text'>
                    {isHovered ? t('addPeople.copyStream') : liveStreamViewURL}
                </div>
                <Icon src = { IconCopy } />
            </>
        );
    }

    return (
        <>
            <span>{t('addPeople.shareStream')}</span>
            <div
                className = { `invite-more-dialog stream${isClicked ? ' clicked' : ''}` }
                onClick = { onClick }
                onMouseOut = { onHoverOut }
                onMouseOver = { onHoverIn }>
                { renderLinkContent() }
            </div>
            <div className = 'invite-more-dialog separator' />
        </>
    );
}

export default translate(LiveStreamSection);
