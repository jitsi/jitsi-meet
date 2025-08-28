import React from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import CopyButton from '../../../../base/buttons/CopyButton.web';
import { getDecodedURI } from '../../../../base/util/uri';


interface IProps {

    /**
     * The URL of the conference.
     */
    url: string;
}

const useStyles = makeStyles()(theme => {
    return {
        label: {
            display: 'block',
            marginBottom: theme.spacing(2)
        }
    };
});

/**
 * Component meant to enable users to copy the conference URL.
 *
 * @returns {React$Element<any>}
 */
function CopyMeetingLinkSection({ url }: IProps) {
    const { classes } = useStyles();
    const { t } = useTranslation();

    return (
        <>
            <p className = { classes.label }>{t('addPeople.shareLink')}</p>
            <CopyButton
                accessibilityText = { t('addPeople.accessibilityLabel.meetingLink', { url: getDecodedURI(url) }) }
                className = 'invite-more-dialog-conference-url'
                displayedText = { getDecodedURI(url) }
                id = 'add-people-copy-link-button'
                textOnCopySuccess = { t('addPeople.linkCopied') }
                textOnHover = { t('addPeople.copyLink') }
                textToCopy = { url } />
        </>
    );
}

export default CopyMeetingLinkSection;
