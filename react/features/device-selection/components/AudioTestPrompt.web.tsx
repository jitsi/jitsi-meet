import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { openDialog } from '../../base/dialog/actions';
import Button from '../../base/ui/components/web/Button';

import AudioTest from './AudioTest.web';

interface IProps {

    /**
     * Whether the settings are open on the welcome page.
     */
    isDisplayedOnWelcomePage: boolean;
}

const useStyles = makeStyles()(theme => {
    return {
        card: {
            alignItems: 'center',
            backgroundColor: theme.palette.settingsSectionBackground,
            border: `1px solid ${theme.palette.dialogBorder}`,
            borderRadius: `${theme.shape.borderRadius}px`,
            display: 'flex',
            gap: '12px',
            padding: '12px'
        },
        description: {
            ...theme.typography.labelRegular,
            color: theme.palette.dialogSecondaryText
        },
        text: {
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            gap: theme.spacing(1)
        },
        title: {
            ...theme.typography.bodyShortBold,
            color: theme.palette.dialogText
        }
    };
});

/**
 * Offers the audio test in the audio settings.
 *
 * @param {IProps} props - The component's props.
 * @returns {JSX.Element}
 */
const AudioTestPrompt = ({ isDisplayedOnWelcomePage }: IProps) => {
    const { classes } = useStyles();
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const openTest = useCallback(() => dispatch(openDialog('AudioTest', AudioTest, {
        isDisplayedOnWelcomePage
    })), [ isDisplayedOnWelcomePage ]);

    return (
        <div className = { classes.card }>
            <div className = { classes.text }>
                <span className = { classes.title }>{ t('audioTest.promptTitle') }</span>
                <span className = { classes.description }>{ t('audioTest.promptDescription') }</span>
            </div>
            <Button
                accessibilityLabel = { t('audioTest.promptButton') }
                labelKey = 'audioTest.promptButton'
                onClick = { openTest }
                size = 'small' />
        </div>
    );
};

export default AudioTestPrompt;
