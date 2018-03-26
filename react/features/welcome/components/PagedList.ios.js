// @flow

import React from 'react';
import { View, TabBarIOS } from 'react-native';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n';
import { MeetingList, refreshCalendarEntryList } from '../../calendar-sync';
import { RecentList } from '../../recent-list';

import AbstractPagedList from './AbstractPagedList';
import styles from './styles';

const CALENDAR_ICON = require('../../../../images/calendar.png');

/**
 * A platform specific component to render a paged or tabbed list/view.
 *
 * @extends PagedList
 */
class PagedList extends AbstractPagedList {

    /**
     * Constructor of the PagedList Component.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);
        this._onTabSelected = this._onTabSelected.bind(this);
    }

    /**
     * Renders the paged list.
     *
     * @inheritdoc
     */
    render() {
        const { pageIndex } = this.state;
        const { disabled, t } = this.props;

        return (
            <View
                style = { [
                    styles.pagedListContainer,
                    disabled ? styles.pagedListContainerDisabled : null
                ] }>
                <TabBarIOS
                    itemPositioning = 'fill'
                    style = { styles.pagedList }>
                    <TabBarIOS.Item
                        onPress = { this._onTabSelected(0) }
                        selected = { pageIndex === 0 }
                        systemIcon = 'history' >
                        <RecentList disabled = { disabled } />
                    </TabBarIOS.Item>
                    <TabBarIOS.Item
                        icon = { CALENDAR_ICON }
                        onPress = { this._onTabSelected(1) }
                        selected = { pageIndex === 1 }
                        title = { t('welcomepage.calendar') } >
                        <MeetingList
                            disabled = { disabled } />
                    </TabBarIOS.Item>
                </TabBarIOS>
            </View>
        );
    }

    _onTabSelected: number => Function;

    /**
     * Constructs a callback to update the selected tab.
     *
     * @private
     * @param {number} tabIndex - The selected tab.
     * @returns {Function}
     */
    _onTabSelected(tabIndex) {
        return () => {
            this.setState({
                pageIndex: tabIndex
            });

            if (tabIndex === 1) {
                /**
                 * This is a workaround as TabBarIOS doesn't invoke
                 * componentWillReciveProps on prop change of the
                 * MeetingList component.
                 */
                this.props.dispatch(refreshCalendarEntryList());
            }
        };
    }
}

export default translate(connect()(PagedList));
