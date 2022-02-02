// @flow
import React from 'react';
import { useTranslation } from 'react-i18next';
import { withTheme } from 'react-native-paper';
import { useSelector } from 'react-redux';

import { IconSearch, Icon } from '../../../base/icons';
import ClearableInput from '../../../participants-pane/components/native/ClearableInput';
import { isSpeakerStatsSearchDisabled } from '../../functions';

import styles from './styles';

/**
 * The type of the React {@code Component} props of {@link SpeakerStatsSearch}.
 */
type Props = {

    /**
     * The function to initiate the change in the speaker stats table.
     */
    onSearch: Function,

    /**
     * Theme used for styles.
     */
     theme: Object
};

/**
 * React component for display an individual user's speaker stats.
 *
 * @returns {React$Element<any>}
 */
function SpeakerStatsSearch({ onSearch, theme }: Props) {
    const { t } = useTranslation();

    const disableSpeakerStatsSearch = useSelector(isSpeakerStatsSearchDisabled);

    if (disableSpeakerStatsSearch) {
        return null;
    }

    return (
        <ClearableInput
            customStyles = { styles.speakerStatsSearch }
            onChange = { onSearch }
            placeholder = { t('speakerStats.search') }
            placeholderColor = { theme.palette.text03 }
            prefixComponent = {
                <Icon
                    color = { theme.palette.text03 }
                    size = { 20 }
                    src = { IconSearch }
                    style = { styles.speakerStatsSearch.searchIcon } />
            }
            selectionColor = { theme.palette.text01 } />
    );
}

export default withTheme(SpeakerStatsSearch);
