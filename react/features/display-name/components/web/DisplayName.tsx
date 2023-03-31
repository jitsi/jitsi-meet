import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import {
    getParticipantById,
    getParticipantDisplayName
} from '../../../base/participants/functions';
import { updateSettings } from '../../../base/settings/actions';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import Tooltip from '../../../base/tooltip/components/Tooltip';
import { getIndicatorsTooltipPosition } from '../../../filmstrip/functions.web';
import { appendSuffix } from '../../functions';

/**
 * The type of the React {@code Component} props of {@link DisplayName}.
 */
interface IProps {

    /**
     * Whether or not the display name should be editable on click.
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
            ...withPixelLineHeight(theme.typography.labelBold),
            color: theme.palette.text01,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        },

        editDisplayName: {
            outline: 'none',
            border: 'none',
            background: 'none',
            boxShadow: 'none',
            padding: 0,
            ...withPixelLineHeight(theme.typography.labelBold),
            color: theme.palette.text01
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

    useEffect(() => {
        if (isEditing && nameInputRef.current) {
            nameInputRef.current.select();
        }
    }, [ isEditing ]);

    const onClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
    }, []);

    const onChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setEditDisplayNameValue(event.target.value);
    }, []);

    const onSubmit = useCallback(() => {
        dispatch(updateSettings({
            displayName: editDisplayNameValue
        }));

        setEditDisplayNameValue('');
        setIsEditing(false);
        nameInputRef.current = null;
    }, [ editDisplayNameValue, nameInputRef ]);

    const onKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            onSubmit();
        }
    }, [ onSubmit ]);

    const onStartEditing = useCallback((e: React.MouseEvent) => {
        if (allowEditing) {
            e.stopPropagation();
            setIsEditing(true);
            setEditDisplayNameValue(configuredDisplayName);
        }
    }, [ allowEditing ]);

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
            content = { appendSuffix(nameToDisplay, displayNameSuffix) }
            position = { getIndicatorsTooltipPosition(thumbnailType) }>
            <span
                className = { `displayname ${classes.displayName}` }
                id = { elementID }
                onClick = { onStartEditing }>
                {appendSuffix(nameToDisplay, displayNameSuffix)}
            </span>
        </Tooltip>
    );
};


export default DisplayName;
