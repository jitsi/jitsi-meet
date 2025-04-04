import React, { ChangeEvent, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import Select from '../../../base/ui/components/web/Select';
import { setRequestingSubtitles } from '../../actions.any';
import { getAvailableSubtitlesLanguages } from '../../functions.any';

/**
 * The styles for the LanguageSelector component.
 *
 * @param {Theme} theme - The MUI theme.
 * @returns {Object} The styles object.
 */
const useStyles = makeStyles()(theme => {
    return {
        container: {
            display: 'flex',
            alignItems: 'center',
            padding: theme.spacing(2),
            gap: theme.spacing(2)
        },
        select: {
            flex: 1,
            minWidth: 200
        },
        label: {
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            color: theme.palette.text01,
            whiteSpace: 'nowrap'
        }
    };
});

/**
 * Component that renders a language selection dropdown.
 * Uses the same language options as LanguageSelectorDialog and
 * updates the subtitles language preference in Redux.
 *
 * @param {IProps} props - The component props.
 * @returns {JSX.Element} - The rendered component.
 */
function LanguageSelector() {
    const { t } = useTranslation();
    const { classes } = useStyles();
    const dispatch = useDispatch();
    const selectedLanguage = useSelector((state: IReduxState) => state['features/subtitles']._language);
    const languageCodes = useSelector((state: IReduxState) => getAvailableSubtitlesLanguages(
        state,
        selectedLanguage?.replace('translation-languages:', '')
    ));

    /**
     * Maps available languages to Select component options format.
     *
     * @type {Array<{value: string, label: string}>}
     */
    const languages = [ 'transcribing.original', ...languageCodes.map(lang => `translation-languages:${lang}`) ]
        .map(lang => {
            return {
                value: lang,
                label: t(lang)
            };
        });

    /**
     * Handles language selection changes.
     * Dispatches the setRequestingSubtitles action with the new language.
     *
     * @param {string} value - The selected language code.
     * @returns {void}
     */
    const onLanguageChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
        let { value }: { value?: string | null; } = e.target;

        if (value === 'transcribing.original') {
            value = null;
        }
        dispatch(setRequestingSubtitles(true, true, value));

        if (value !== null) {
            value = value.replace('translation-languages:', '');
        }
    }, [ dispatch ]);

    return (
        <div className = { classes.container }>
            <span className = { classes.label }>
                {t('transcribing.translateTo')}:
            </span>
            <Select
                className = { classes.select }
                id = 'subtitles-language-select'
                onChange = { onLanguageChange }
                options = { languages }
                value = { selectedLanguage || 'transcribing.original' } />
        </div>
    );
}

export default LanguageSelector;
