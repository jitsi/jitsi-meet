import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState, IStore } from '../../../../app/types';
import { changeTheme } from '../../../components/themes/ThemeManager';
import Select from '../../../ui/components/web/Select';

const useStyles = makeStyles()(theme => ({
    container: {
        marginTop: theme.spacing(2)
    }
}));

interface IThemeInfo {
    file: string;
    name: string;
}

const ThemeSwitcher = () => {
    const { classes, cx } = useStyles();
    const dispatch = useDispatch<IStore['dispatch']>();

    const themesFromConfig = useSelector((state: IReduxState) => state['features/base/config'].availableThemes) as unknown as IThemeInfo[] ?? [];
    const selectedThemeUrl = useSelector((state: IReduxState) => state['features/dynamic-branding'].selectedThemeUrl);

    const availableThemes = useMemo(() => [
        { name: 'Default', key: 'default', url: null },
        ...themesFromConfig.map((theme: { file: string; name: string; }) => {
            const key = theme.file.replace('-theme.json', '');

            return {
                ...theme,
                key,
                url: theme.file
            };
        })
    ], [ themesFromConfig ]);

    const selectedThemeKey = useMemo(() => {
        const found = availableThemes.find(theme => theme.url === selectedThemeUrl);

        return found ? found.key : 'default';
    }, [ availableThemes, selectedThemeUrl ]);


    const handleThemeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const newKey = e.target.value;
        const theme = availableThemes.find(t => t.key === newKey);

        if (theme) {
            dispatch(changeTheme(theme.url));
        }
    }, [ availableThemes, dispatch ]);

    const themeOptions = useMemo(() => availableThemes.map(theme => ({
        label: theme.name,
        value: theme.key
    })), [ availableThemes ]);


    return (
        <div className = { cx('settings-sub-pane-element', classes.container) }>
            <Select
                id = 'theme-switcher'
                label = 'Theme'
                onChange = { handleThemeChange }
                options = { themeOptions }
                value = { selectedThemeKey } />
        </div>
    );
};

export default ThemeSwitcher;
