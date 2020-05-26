// @flow

import React, { useState } from 'react';

import { translate } from '../../../../base/i18n';
import { Icon, IconCheck, IconCopy } from '../../../../base/icons';

import { copyText } from './utils';

type Props = {

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

    /**
     * The URL of the conference.
     */
    url: string
};

/**
 * Component meant to enable users to copy the conference URL.
 *
 * @returns {React$Element<any>}
 */
function CopyMeetingLinkSection({ t, url }: Props) {
    const [ isClicked, setIsClicked ] = useState(false);
    const [ isHovered, setIsHovered ] = useState(false);

    /**
     * Click handler for the element.
     *
     * @returns {void}
     */
    function onClick() {
        setIsHovered(false);
        if (copyText(url)) {
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
                    <div className = 'invite-more-dialog copy-link-text selected'>
                        {t('addPeople.linkCopied')}
                    </div>
                    <Icon src = { IconCheck } />
                </>
            );
        }

        const displayUrl = decodeURI(url.replace(/^https?:\/\//i, ''));

        return (
            <>
                <div className = 'invite-more-dialog invite-more-dialog-conference-url copy-link-text'>
                    {isHovered ? t('addPeople.copyLink') : displayUrl}
                </div>
                <Icon src = { IconCopy } />
            </>
        );
    }

    return (
        <>
            <span>{t('addPeople.shareLink')}</span>
            <div
                className = { `invite-more-dialog copy-link${isClicked ? ' clicked' : ''}` }
                onClick = { onClick }
                onMouseOut = { onHoverOut }
                onMouseOver = { onHoverIn }>
                { renderLinkContent() }
            </div>
        </>
    );
}

export default translate(CopyMeetingLinkSection);
