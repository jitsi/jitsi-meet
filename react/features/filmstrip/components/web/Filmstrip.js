/* @flow */

import React, { PureComponent } from 'react';
import { FixedSizeList, FixedSizeGrid } from 'react-window';
import type { Dispatch } from 'redux';

import {
    createShortcutEvent,
    createToolbarEvent,
    sendAnalytics
} from '../../../analytics';
import { getToolbarButtons } from '../../../base/config';
import { translate } from '../../../base/i18n';
import { Icon, IconMenuDown, IconMenuUp } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { isButtonEnabled } from '../../../toolbox/functions.web';
import { LAYOUTS, getCurrentLayout } from '../../../video-layout';
import { setFilmstripVisible } from '../../actions';
import { setFilmstripItemsRendered } from '../../actions.web';
import { TILE_HORIZONTAL_MARGIN, TILE_VERTICAL_MARGIN } from '../../constants';
import { shouldRemoteVideosBeVisible } from '../../functions';

import Thumbnail from './Thumbnail';
import ThumbnailWrapper from './ThumbnailWrapper';

declare var APP: Object;
declare var interfaceConfig: Object;

const TOOLBAR_SIZE = 72;

/**
 * The type of the React {@code Component} props of {@link Filmstrip}.
 */
type Props = {

    /**
     * Additional CSS class names top add to the root.
     */
    _className: string,

    /**
     * The current layout of the filmstrip.
     */
    _currentLayout: string,

    /**
     * The number of columns in tile view.
     */
    _columns: number,

    /**
     * The width of the filmstrip.
     */
    _filmstripWidth: number,

    _filmstripHeight: number,

    /**
     * Whether the filmstrip button is enabled.
     */
    _isFilmstripButtonEnabled: boolean,

    /**
     * The participants in the call.
     */
    _remoteParticipants: Array<Object>,

    _thumbnailSize: Object,

    /**
     * Additional CSS class names to add to the container of all the thumbnails.
     */
    _videosClassName: string,

    /**
     * Whether or not the filmstrip videos should currently be displayed.
     */
    _visible: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Dispatch<any>,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Implements a React {@link Component} which represents the filmstrip on
 * Web/React.
 *
 * @extends Component
 */
class Filmstrip extends PureComponent <Props> {

    /**
     * Initializes a new {@code Filmstrip} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onShortcutToggleFilmstrip = this._onShortcutToggleFilmstrip.bind(this);
        this._onToolbarToggleFilmstrip = this._onToolbarToggleFilmstrip.bind(this);
        this._onGridItemsRendered = this._onGridItemsRendered.bind(this);
        this._onListItemsRendered = this._onListItemsRendered.bind(this);
        this._gridItemKey = this._gridItemKey.bind(this);
        this._listItemKey = this._listItemKey.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        APP.keyboardshortcut.registerShortcut(
            'F',
            'filmstripPopover',
            this._onShortcutToggleFilmstrip,
            'keyboardShortcuts.toggleFilmstrip'
        );
    }

    /**
     * Implements React's {@link Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        APP.keyboardshortcut.unregisterShortcut('F');
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const filmstripStyle = { };
        const { _currentLayout } = this.props;
        const tileViewActive = _currentLayout === LAYOUTS.TILE_VIEW;

        switch (_currentLayout) {
        case LAYOUTS.VERTICAL_FILMSTRIP_VIEW:
            // Adding 18px for the 2px margins, 2px borders on the left and right and 5px padding on the left and right.
            // Also adding 7px for the scrollbar.
            filmstripStyle.maxWidth = (interfaceConfig.FILM_STRIP_MAX_HEIGHT || 120) + 25;
            break;
        }

        let toolbar = null;

        if (this.props._isFilmstripButtonEnabled) {
            toolbar = this._renderToggleButton();
        }

        return (
            <div
                className = { `filmstrip ${this.props._className}` }
                style = { filmstripStyle }>
                { toolbar }
                <div
                    className = { this.props._videosClassName }
                    id = 'remoteVideos'>
                    <div
                        className = 'filmstrip__videos'
                        id = 'filmstripLocalVideo'>
                        <div id = 'filmstripLocalVideoThumbnail'>
                            {
                                !tileViewActive && <Thumbnail
                                    key = 'local' />
                            }
                        </div>
                    </div>
                    {
                        this._renderRemoteParticipants()
                    }
                </div>
            </div>
        );
    }

    /**
     *
     * @param {*} index
     */
    _listItemKey(index) {
        const { _remoteParticipants, _remoteParticipantsLength } = this.props;

        if (typeof index !== 'number' || _remoteParticipantsLength <= index) {
            return `empty-${index}`;
        }

        return _remoteParticipants[_remoteParticipantsLength - index - 1];
    }

    /**
     *
     * @param {*} param0
     */
    _gridItemKey({ columnIndex, data, rowIndex }) {
        const { _columns, _remoteParticipants, _remoteParticipantsLength } = this.props;
        const index = (rowIndex * _columns) + columnIndex;

        if (index > _remoteParticipantsLength) {
            return `empty-${index}`;
        }

        if (index === _remoteParticipantsLength) {
            return 'local';
        }

        return _remoteParticipants[index];
    }

    /**
     *
     * @param {*} param0
     * @returns {void}
     */
    _onListItemsRendered({ overscanStartIndex, overscanStopIndex, visibleStartIndex, visibleStopIndex }) {
        const { dispatch, _remoteParticipantsLength } = this.props;

        // startIndex and endIndex are swapped because we show the thumbnails in reverse order.
        const endIndex = _remoteParticipantsLength - overscanStartIndex;
        const startIndex = Math.max(_remoteParticipantsLength - overscanStopIndex, 0);

        dispatch(setFilmstripItemsRendered(startIndex, endIndex));

        console.error(`_onListItemsRendered ${overscanStartIndex}, ${overscanStopIndex}, ${
            visibleStartIndex}, ${visibleStopIndex}`);
    }

    /**
     *
     * @param {*} param0
     * @returns {void}
     */
    _onGridItemsRendered({
        overscanColumnStartIndex,
        overscanColumnStopIndex,
        overscanRowStartIndex,
        overscanRowStopIndex,
        visibleColumnStartIndex,
        visibleColumnStopIndex,
        visibleRowStartIndex,
        visibleRowStopIndex
    }) {
        const { columns, dispatch, _remoteParticipantsLength } = this.props;
        const startIndex = (overscanRowStartIndex * columns) + overscanColumnStartIndex + 1;
        const endIndex = Math.min(
            (overscanRowStopIndex * columns) + overscanColumnStopIndex + 1,
            _remoteParticipantsLength - 1);

        dispatch(setFilmstripItemsRendered(startIndex, endIndex));

        console.error(`_onListItemsRendered ${overscanColumnStartIndex}, ${overscanColumnStopIndex}, ${
            overscanRowStartIndex}, ${overscanRowStopIndex}, ${visibleColumnStartIndex} , ${visibleColumnStopIndex}, ${
            visibleRowStartIndex}, ${visibleRowStopIndex}`);

        // 0, 4, 2, 8, 0 , 4, 3, 8
        // 0, 4, 2, 7, 0 , 4, 3, 7

        // 0, 4, 4, 11, 0 , 4, 5, 10
        // 0, 4, 4, 10, 0 , 4, 5, 10
    }

    /**
     * Renders the thumbnails for remote participants.
     *
     * @returns {ReactElement}
     */
    _renderRemoteParticipants() {
        const {
            _columns,
            _currentLayout,
            _filmstripHeight,
            _filmstripWidth,
            _remoteParticipantsLength,
            _rows,
            _thumbnailSize = {},
            _toolbarVisible
        } = this.props;
        const { height: thumbnailHeight, width: thumbnailWidth } = _thumbnailSize;

        if (!thumbnailWidth || isNaN(thumbnailWidth) || !thumbnailHeight
            || isNaN(thumbnailHeight) || !_filmstripHeight || isNaN(_filmstripHeight) || !_filmstripWidth
            || isNaN(_filmstripWidth)) {
            return null;
        }

        if (_currentLayout === LAYOUTS.TILE_VIEW) {
            return (
                <FixedSizeGrid
                    className = 'filmstrip__videos remote-videos'
                    columnCount = { _columns }
                    columnWidth = { thumbnailWidth + TILE_HORIZONTAL_MARGIN }
                    height = { _filmstripHeight }
                    initialScrollLeft = { 0 }
                    initialScrollTop = { 0 }
                    itemKey = { this._gridItemKey }
                    onItemsRendered = { this._onGridItemsRendered }
                    rowCount = { _rows }
                    rowHeight = { thumbnailHeight + TILE_VERTICAL_MARGIN }
                    width = { _filmstripWidth }>
                    {
                        ThumbnailWrapper
                    }
                </FixedSizeGrid>
            );
        }


        const props = {
            itemCount: _remoteParticipantsLength,
            className: 'filmstrip__videos remote-videos',
            height: _filmstripHeight,
            onItemsRendered: this._onListItemsRendered,
            itemKey: this._listItemKey,
            width: _filmstripWidth,
            style: {
                willChange: 'auto'
            }
        };

        if (_currentLayout === LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW) {
            const itemSize = thumbnailHeight + TILE_VERTICAL_MARGIN;
            const isNotOverflowing = (_remoteParticipantsLength * itemSize) <= _filmstripWidth;

            props.itemSize = itemSize;
            props.layout = 'horizontal';
            if (isNotOverflowing) {
                props.className += ' is-not-overflowing';
            }

        } else if (_currentLayout === LAYOUTS.VERTICAL_FILMSTRIP_VIEW) {
            const itemSize = thumbnailHeight + TILE_VERTICAL_MARGIN;
            const isNotOverflowing = (_remoteParticipantsLength * itemSize) <= _filmstripHeight;

            if (isNotOverflowing) {
                props.className += ' is-not-overflowing';
            }

            props.itemSize = itemSize;
            props.height = _filmstripHeight - (_toolbarVisible ? TOOLBAR_SIZE : 0);
        }

        return (
            <FixedSizeList { ...props }>
                {
                    ThumbnailWrapper
                }
            </FixedSizeList>
        );
    }

    /**
     * Dispatches an action to change the visibility of the filmstrip.
     *
     * @private
     * @returns {void}
     */
    _doToggleFilmstrip() {
        this.props.dispatch(setFilmstripVisible(!this.props._visible));
    }

    _onShortcutToggleFilmstrip: () => void;

    /**
     * Creates an analytics keyboard shortcut event and dispatches an action for
     * toggling filmstrip visibility.
     *
     * @private
     * @returns {void}
     */
    _onShortcutToggleFilmstrip() {
        sendAnalytics(createShortcutEvent(
            'toggle.filmstrip',
            {
                enable: this.props._visible
            }));

        this._doToggleFilmstrip();
    }

    _onToolbarToggleFilmstrip: () => void;

    /**
     * Creates an analytics toolbar event and dispatches an action for opening
     * the speaker stats modal.
     *
     * @private
     * @returns {void}
     */
    _onToolbarToggleFilmstrip() {
        sendAnalytics(createToolbarEvent(
            'toggle.filmstrip.button',
            {
                enable: this.props._visible
            }));

        this._doToggleFilmstrip();
    }

    /**
     * Creates a React Element for changing the visibility of the filmstrip when
     * clicked.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderToggleButton() {
        const icon = this.props._visible ? IconMenuDown : IconMenuUp;
        const { t } = this.props;

        return (
            <div className = 'filmstrip__toolbar'>
                <button
                    aria-label = { t('toolbar.accessibilityLabel.toggleFilmstrip') }
                    id = 'toggleFilmstripButton'
                    onClick = { this._onToolbarToggleFilmstrip }>
                    <Icon src = { icon } />
                </button>
            </div>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code Filmstrip}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const toolbarButtons = getToolbarButtons(state);
    const { visible, remoteParticipants } = state['features/filmstrip'];
    const reduceHeight = state['features/toolbox'].visible && toolbarButtons.length;
    const remoteVideosVisible = shouldRemoteVideosBeVisible(state);
    const { isOpen: shiftRight } = state['features/chat'];
    const className = `${remoteVideosVisible ? '' : 'hide-videos'} ${
        reduceHeight ? 'reduce-height' : ''
    } ${shiftRight ? 'shift-right' : ''}`.trim();
    const videosClassName = `filmstrip__videos${visible ? '' : ' hidden'}`;
    const {
        gridDimensions = {},
        filmstripHeight,
        filmstripWidth,
        thumbnailSize: tileViewThumbnailSize
    } = state['features/filmstrip'].tileViewDimensions;
    const _currentLayout = getCurrentLayout(state);
    let _thumbnailSize, remoteFilmstripHeight, remoteFilmstripWidth;

    switch (_currentLayout) {
    case LAYOUTS.TILE_VIEW:
        _thumbnailSize = tileViewThumbnailSize;
        remoteFilmstripHeight = filmstripHeight;
        remoteFilmstripWidth = filmstripWidth;
        break;
    case LAYOUTS.VERTICAL_FILMSTRIP_VIEW: {
        const { remote, remoteVideosContainer } = state['features/filmstrip'].verticalViewDimensions;

        _thumbnailSize = remote;
        remoteFilmstripHeight = remoteVideosContainer?.height;
        remoteFilmstripWidth = remoteVideosContainer?.width;
        break;
    }
    case LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW: {
        const { remote, remoteVideosContainer } = state['features/filmstrip'].horizontalViewDimensions;

        _thumbnailSize = remote;
        remoteFilmstripHeight = remoteVideosContainer?.height;
        remoteFilmstripWidth = remoteVideosContainer?.width;
        break;
    }
    }

    return {
        _className: className,
        _columns: gridDimensions.columns,
        _currentLayout,
        _filmstripHeight: remoteFilmstripHeight,
        _filmstripWidth: remoteFilmstripWidth,
        _isFilmstripButtonEnabled: isButtonEnabled('filmstrip', state),
        _remoteParticipantsLength: state['features/base/participants'].length - 1,
        _remoteParticipants: remoteParticipants,
        _rows: gridDimensions.rows,
        _thumbnailSize,
        _toolbarVisible: reduceHeight,
        _videosClassName: videosClassName,
        _visible: visible
    };
}

export default translate(connect(_mapStateToProps)(Filmstrip));
