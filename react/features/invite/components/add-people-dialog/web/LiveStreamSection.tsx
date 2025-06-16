/* eslint-disable react/jsx-no-bind */

import React, { useState } from 'react';
import { WithTranslation } from 'react-i18next';

import { translate } from '../../../../base/i18n/functions';
import Icon from '../../../../base/icons/components/Icon';
import { IconCheck, IconCopy } from '../../../../base/icons/svg';
import { copyText } from '../../../../base/util/copyText.web';

interface IProps extends WithTranslation {

    /**
     * The current known URL for a live stream in progress.
     */
    liveStreamViewURL: string;
}

/**
 * Section of the {@code AddPeopleDialog} that renders the
 * live streaming url, allowing a copy action.
 *
 * @returns {React$Element<any>}
 */
function LiveStreamSection({ liveStreamViewURL, t }: IProps) {
    const [ isClicked, setIsClicked ] = useState(false);
    const [ isHovered, setIsHovered ] = useState(false);

    /**
     * Click handler for the element.
     *
     * @returns {void}
     */
    async function onClick() {
        setIsHovered(false);

        const isCopied = await copyText(liveStreamViewURL);

        if (isCopied) {
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
