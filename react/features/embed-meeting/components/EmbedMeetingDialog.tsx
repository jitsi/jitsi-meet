import React from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../app/types';
import CopyButton from '../../base/buttons/CopyButton.web';
import { getInviteURL } from '../../base/connection/functions';
import { translate } from '../../base/i18n/functions';
import Dialog from '../../base/ui/components/web/Dialog';
import Input from '../../base/ui/components/web/Input';

interface IProps extends WithTranslation {

    /**
     * The URL of the conference.
     */
    url: string;
}

const useStyles = makeStyles()(theme => {
    return {
        container: {
            paddingTop: theme.spacing(1)
        },

        button: {
            marginTop: theme.spacing(3)
        }
    };
});

/**
 * Allow users to embed a jitsi meeting in an iframe.
 *
 * @returns {React$Element<any>}
 */
function EmbedMeeting({ t, url }: IProps) {
    const { classes } = useStyles();

    /**
     * Get the embed code for a jitsi meeting.
     *
     * @returns {string} The iframe embed code.
     */
    const getEmbedCode = () =>
        `<iframe allow="camera; microphone; fullscreen; display-capture; autoplay" src="${url}"`
        + ' style="height: 100%; width: 100%; border: 0px;"></iframe>';

    return (
        <Dialog
            cancel = {{ hidden: true }}
            ok = {{ hidden: true }}
            titleKey = { 'embedMeeting.title' }>
            <div className = { classes.container }>
                <Input
                    accessibilityLabel = { t('dialog.embedMeeting') }
                    id = 'embed-meeting-input'
                    readOnly = { true }
                    textarea = { true }
                    value = { getEmbedCode() } />
                <CopyButton
                    accessibilityText = { t('addPeople.copyLink') }
                    className = { classes.button }
                    displayedText = { t('dialog.copy') }
                    id = 'embed-meeting-copy-button'
                    textOnCopySuccess = { t('dialog.copied') }
                    textOnHover = { t('dialog.copy') }
                    textToCopy = { getEmbedCode() } />
            </div>
        </Dialog>
    );
}

const mapStateToProps = (state: IReduxState) => {
    return {
        url: getInviteURL(state)
    };
};

export default translate(connect(mapStateToProps)(EmbedMeeting));
