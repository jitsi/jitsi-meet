import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import {
    getParticipantById,
    getParticipantDisplayName
} from '../../../base/participants/functions';
import { updateSettings } from '../../../base/settings/actions';
import Tooltip from '../../../base/tooltip/components/Tooltip';
import { getIndicatorsTooltipPosition } from '../../../filmstrip/functions.web';
import { appendSuffix } from '../../functions';

import { getDisplayNameColor } from './styles';

/**
 * The type of the React {@code Component} props of {@link DisplayName}.
 */
interface IProps {

    /**
     * Whether or not the display name should be editable on click or from the keyboard.
     */
    allowEditing: boolean;

    /**
     * A string to append to the displayName, if provided.
     */
    displayNameSuffix: string;

    /**
     * The ID attribute to add to the component. Useful for global querying for
     * the component by legacy components and torture tests.
     */
    elementID: string;

    /**
     * The ID of the participant whose name is being displayed.
     */
    participantID: string;

    /**
     * The type of thumbnail.
     */
    thumbnailType?: string;
}

const useStyles = makeStyles()(theme => {
    return {
        displayName: {
            ...theme.typography.labelBold,
            color: getDisplayNameColor(theme),
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',

            '&:focus-visible': {
                outline: `2px solid ${getDisplayNameColor(theme)}`,
                outlineOffset: '-2px'
            }
        },

        displayNameButton: {
            background: 'none',
            border: 'none',
            margin: 0,
            maxWidth: '100%',
            minWidth: 0,
            outline: 'none',
            padding: 0,
            textAlign: 'left'
        },

        editDisplayName: {
            outline: 'none',
            border: 'none',
            background: 'none',
            boxShadow: 'none',
            padding: 0,
            ...theme.typography.labelBold,
            color: getDisplayNameColor(theme)
        }
    };
});

const DisplayName = ({
    allowEditing,
    displayNameSuffix,
    elementID,
    participantID,
    thumbnailType
}: IProps) => {
    const { classes } = useStyles();
    const configuredDisplayName = useSelector((state: IReduxState) =>
        getParticipantById(state, participantID))?.name ?? '';
    const nameToDisplay = useSelector((state: IReduxState) => getParticipantDisplayName(state, participantID));
    const [ editDisplayNameValue, setEditDisplayNameValue ] = useState('');
    const [ isEditing, setIsEditing ] = useState(false);
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const nameInputRef = useRef<HTMLInputElement | null>(null);
    const displayNameRef = useRef<HTMLButtonElement>(null);
    const restoreFocusOnCloseRef = useRef(false);
    const cancelEditingRef = useRef(false);

    useEffect(() => {
        if (isEditing && nameInputRef.current) {
            nameInputRef.current.select();
        }
    }, [ isEditing ]);

    useLayoutEffect(() => {
        if (isEditing) {
            return;
        }

        cancelEditingRef.current = false;

        if (!restoreFocusOnCloseRef.current) {
            return;
        }

        restoreFocusOnCloseRef.current = false;
        displayNameRef.current?.focus({ focusVisible: true });
    }, [ isEditing ]);

    const onClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
    }, []);

    const onChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setEditDisplayNameValue(event.target.value);
    }, []);

    const onSubmit = useCallback(() => {
        if (cancelEditingRef.current) {
            return;
        }

        dispatch(updateSettings({
            displayName: editDisplayNameValue
        }));

        setEditDisplayNameValue('');
        setIsEditing(false);
        nameInputRef.current = null;
    }, [ editDisplayNameValue, nameInputRef ]);

    const onKeyDown = useCallback((e: React.KeyboardEvent) => {
        if(e.repeat) return;

        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            cancelEditingRef.current = true;
            setEditDisplayNameValue('');
            setIsEditing(false);
            nameInputRef.current = null;

            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            onSubmit();
        }
    }, [ onSubmit ]);

    const startEditing = useCallback((restoreFocus = false) => {
        restoreFocusOnCloseRef.current = restoreFocus;
        setIsEditing(true);
        setEditDisplayNameValue(configuredDisplayName);
    }, [ configuredDisplayName ]);

    const onStartEditing = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();

        startEditing(e.detail === 0);
    }, [ startEditing ]);

    const onDisplayNameKeyPress = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
        e.stopPropagation();
    }, []);

    const displayedName = appendSuffix(nameToDisplay, displayNameSuffix);

    if (allowEditing && isEditing) {
        return (
            <input
                autoFocus = { true }
                className = { classes.editDisplayName }
                id = 'editDisplayName'
                onBlur = { onSubmit }
                onChange = { onChange }
                onClick = { onClick }
                onKeyDown = { onKeyDown }
                placeholder = { t('defaultNickname') }
                ref = { nameInputRef }
                spellCheck = { 'false' }
                type = 'text'
                value = { editDisplayNameValue } />
        );
    }

    return (
        <Tooltip
            content = { displayedName }
            position = { getIndicatorsTooltipPosition(thumbnailType) }>
            {allowEditing
                ? <button
                    aria-label = { t('editDisplayName', { name: displayedName }) }
                    className = { `displayname ${classes.displayName} ${classes.displayNameButton}` }
                    id = { elementID }
                    onClick = { onStartEditing }
                    onKeyPress = { onDisplayNameKeyPress }
                    ref = { displayNameRef }
                    type = 'button'>
                    {displayedName}
                </button>
                : <span
                    className = { `displayname ${classes.displayName}` }
                    id = { elementID }>
                    {displayedName}
                </span>}
        </Tooltip>
    );
};


export default DisplayName;
