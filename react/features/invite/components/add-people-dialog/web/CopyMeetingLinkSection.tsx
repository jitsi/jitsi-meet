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
            <label
                className = { classes.label }
                htmlFor = { 'copy-button-id' }
                id = 'copy-button-label'>{t('addPeople.shareLink')}</label>
            <CopyButton
                aria-label = { t('addPeople.copyLink') }
                className = 'invite-more-dialog-conference-url'
                displayedText = { getDecodedURI(url) }
                id = 'copy-button-id'
                textOnCopySuccess = { t('addPeople.linkCopied') }
                textOnHover = { t('addPeople.copyLink') }
                textToCopy = { url } />
        </>
    );
}

export default CopyMeetingLinkSection;
