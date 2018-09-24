// @flow

import React, { Component } from 'react';
import { View } from 'react-native';
import { connect } from 'react-redux';

import {
    createRecentClickedEvent,
    sendAnalytics
} from '../../analytics';
import { appNavigate } from '../../app';
import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';

import { deleteRecentListEntry } from '../actions';

import ListEntryMenuItem from './ListEntryMenuItem';

/**
 * The type of the React {@code Component} props of
 * {@link ListEntryMenuDialog}.
 */
export type Props = {

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     * Item identifier of the entry.
     */
    itemId: Object,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
}

/**
 * Implements a dialog for the long-press menu on the recent list.
 */
class ListEntryMenuDialog extends Component<Props> {

    /**
     * Constructor of the component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onDelete = this._onDelete.bind(this);
        this._onJoin = this._onJoin.bind(this);
    }

    /**
     * Implements {@code Component}'s render.
     *
     * @inheritdoc
     */
    render() {
        const { t } = this.props;

        return (
            <Dialog
                okHidden = { true }
                titleKey = 'recentList.menuTitle'
                width = { 'small' }>
                <View>
                    <ListEntryMenuItem
                        label = { t('recentList.joinMeeting') }
                        onPress = { this._onJoin } />
                    <ListEntryMenuItem
                        label = { t('recentList.deleteItem') }
                        onPress = { this._onDelete } />
                </View>
            </Dialog>
        );
    }

    _onCancel: () => boolean;

    /**
     * Invokes the passed in {@link onCancel} callback and closes
     * {@code ListEntryMenuDialog}.
     *
     * @private
     * @returns {boolean} True is returned to close the modal.
     */
    _onCancel() {
        return true;
    }

    _onDelete: () => void;

    /**
     * Callback for the delete action in the menu.
     *
     * @returns {void}
     */
    _onDelete() {
        this.props.dispatch(deleteRecentListEntry(this.props.itemId));
    }

    _onJoin: () => void;

    /**
     * Callback for the join action in the menu.
     *
     * @returns {void}
     */
    _onJoin() {
        sendAnalytics(createRecentClickedEvent('recent.meeting.tile'));

        this.props.dispatch(appNavigate(this.props.itemId.url));
    }
}

export default translate(connect()(ListEntryMenuDialog));
