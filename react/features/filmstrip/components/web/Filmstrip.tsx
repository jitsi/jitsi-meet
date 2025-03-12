import clsx from 'clsx';
import { throttle } from 'lodash-es';
import React, { PureComponent } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { FixedSizeGrid, FixedSizeList } from 'react-window';
import { withStyles } from 'tss-react/mui';

import { ACTION_SHORTCUT_TRIGGERED, createShortcutEvent, createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState, IStore } from '../../../app/types';
import { isMobileBrowser } from '../../../base/environment/utils';
import { translate } from '../../../base/i18n/functions';
import Icon from '../../../base/icons/components/Icon';
import { IconArrowDown, IconArrowUp } from '../../../base/icons/svg';
import { getHideSelfView } from '../../../base/settings/functions.any';
import { registerShortcut, unregisterShortcut } from '../../../keyboard-shortcuts/actions';
import { showToolbox } from '../../../toolbox/actions.web';
import { isButtonEnabled, isToolboxVisible } from '../../../toolbox/functions.web';
import { LAYOUTS } from '../../../video-layout/constants';
import { getCurrentLayout } from '../../../video-layout/functions.web';
import {
    setFilmstripVisible,
    setTopPanelVisible,
    setUserFilmstripHeight,
    setUserFilmstripWidth,
    setUserIsResizing,
    setVisibleRemoteParticipants
} from '../../actions.web';
import {
    ASPECT_RATIO_BREAKPOINT,
    DEFAULT_FILMSTRIP_WIDTH,
    FILMSTRIP_TYPE,
    MIN_STAGE_VIEW_HEIGHT,
    MIN_STAGE_VIEW_WIDTH,
    TILE_HORIZONTAL_MARGIN,
    TILE_VERTICAL_MARGIN,
    TOP_FILMSTRIP_HEIGHT
} from '../../constants';
import {
    getVerticalViewMaxWidth,
    isFilmstripDisabled,
    isStageFilmstripTopPanel,
    shouldRemoteVideosBeVisible
} from '../../functions.web';

import AudioTracksContainer from './AudioTracksContainer';
import Thumbnail from './Thumbnail';
import ThumbnailWrapper from './ThumbnailWrapper';
import { styles } from './styles';

/**
 * The type of the React {@code Component} props of {@link Filmstrip}.
 */
interface IProps extends WithTranslation {

    /**
     * Additional CSS class names top add to the root.
     */
    _className: string;

    /**
     * The number of columns in tile view.
     */
    _columns: number;

    /**
     * The current layout of the filmstrip.
     */
    _currentLayout?: string;

    /**
     * Whether or not to hide the self view.
     */
    _disableSelfView: boolean;

    /**
     * Whether vertical/horizontal filmstrip is disabled through config.
     */
    _filmstripDisabled: boolean;

    /**
     * The height of the filmstrip.
     */
    _filmstripHeight: number;

    /**
     * The width of the filmstrip.
     */
    _filmstripWidth: number;

    /**
     * Whether or not we have scroll on the filmstrip.
     */
    _hasScroll: boolean;

    /**
     * Whether this is a recorder or not.
     */
    _iAmRecorder: boolean;

    /**
     * Whether the filmstrip button is enabled.
     */
    _isFilmstripButtonEnabled: boolean;

    /**
    * Whether or not the toolbox is displayed.
    */
    _isToolboxVisible: Boolean;

    /**
     * Whether or not the current layout is vertical filmstrip.
     */
    _isVerticalFilmstrip: boolean;

    /**
     * The local screen share participant. This prop is behind the sourceNameSignaling feature flag.
     */
    _localScreenShareId: string | undefined;

    /**
     * Whether or not the filmstrip videos should currently be displayed.
     */
    _mainFilmstripVisible: boolean;

    /**
     * The maximum width of the vertical filmstrip.
     */
    _maxFilmstripWidth: number;

    /**
     * The maximum height of the top panel.
     */
    _maxTopPanelHeight: number;

    /**
     * The participants in the call.
     */
    _remoteParticipants: Array<string>;

    /**
     * The length of the remote participants array.
     */
    _remoteParticipantsLength: number;

    /**
     * Whether or not the filmstrip should be user-resizable.
     */
    _resizableFilmstrip: boolean;

    /**
     * The number of rows in tile view.
     */
    _rows: number;

    /**
     * The height of the thumbnail.
     */
    _thumbnailHeight: number;

    /**
     * The width of the thumbnail.
     */
    _thumbnailWidth: number;

    /**
     * Whether or not the filmstrip is top panel.
     */
    _topPanelFilmstrip: boolean;

    /**
     * The height of the top panel (user resized).
     */
    _topPanelHeight?: number | null;

    /**
     * The max height of the top panel.
     */
    _topPanelMaxHeight: number;

    /**
     * Whether or not the top panel is visible.
     */
    _topPanelVisible: boolean;

    /**
     * The width of the vertical filmstrip (user resized).
     */
    _verticalFilmstripWidth?: number | null;

    /**
     * Whether or not the vertical filmstrip should have a background color.
     */
    _verticalViewBackground: boolean;

    /**
     * Whether or not the vertical filmstrip should be displayed as grid.
     */
    _verticalViewGrid: boolean;

    /**
     * The max width of the vertical filmstrip.
     */
    _verticalViewMaxWidth: number;

    /**
     * Additional CSS class names to add to the container of all the thumbnails.
     */
    _videosClassName: string;

    /**
     * An object containing the CSS classes.
     */
    classes?: Partial<Record<keyof ReturnType<typeof styles>, string>>;

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: IStore['dispatch'];

    /**
     * The type of filmstrip to be displayed.
     */
    filmstripType: string;
}

interface IState {

    /**
     * Initial top panel height on drag handle mouse down.
     */
    dragFilmstripHeight?: number;

    /**
     * Initial filmstrip width on drag handle mouse down.
     */
    dragFilmstripWidth?: number | null;

    /**
     * Whether or not the mouse is pressed.
     */
    isMouseDown: boolean;

    /**
     * Initial mouse position on drag handle mouse down.
     */
    mousePosition?: number | null;
}

/**
 * Implements a React {@link Component} which represents the filmstrip on
 * Web/React.
 *
 * @augments Component
 */
class Filmstrip extends PureComponent <IProps, IState> {

    _throttledResize: Function;

    /**
     * Initializes a new {@code Filmstrip} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        this.state = {
            isMouseDown: false,
            mousePosition: null,
            dragFilmstripWidth: null
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onShortcutToggleFilmstrip = this._onShortcutToggleFilmstrip.bind(this);
        this._onToolbarToggleFilmstrip = this._onToolbarToggleFilmstrip.bind(this);
        this._onTabIn = this._onTabIn.bind(this);
        this._gridItemKey = this._gridItemKey.bind(this);
        this._listItemKey = this._listItemKey.bind(this);
        this._onGridItemsRendered = this._onGridItemsRendered.bind(this);
        this._onListItemsRendered = this._onListItemsRendered.bind(this);
        this._onToggleButtonTouch = this._onToggleButtonTouch.bind(this);
        this._onDragHandleMouseDown = this._onDragHandleMouseDown.bind(this);
        this._onDragMouseUp = this._onDragMouseUp.bind(this);
        this._onFilmstripResize = this._onFilmstripResize.bind(this);

        this._throttledResize = throttle(
            this._onFilmstripResize,
            50,
            {
                leading: true,
                trailing: false
            });
    }

    /**
     * Implements React's {@link Component#componentDidMount}.
     *
     * @inheritdoc
     */
    override componentDidMount() {
        this.props.dispatch(registerShortcut({
            character: 'F',
            helpDescription: 'keyboardShortcuts.toggleFilmstrip',
            handler: this._onShortcutToggleFilmstrip
        }));

        document.addEventListener('mouseup', this._onDragMouseUp);

        // @ts-ignore
        document.addEventListener('mousemove', this._throttledResize);
    }

    /**
     * Implements React's {@link Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    override componentWillUnmount() {
        this.props.dispatch(unregisterShortcut('F'));

        document.removeEventListener('mouseup', this._onDragMouseUp);

        // @ts-ignore
        document.removeEventListener('mousemove', this._throttledResize);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        const filmstripStyle: any = { };
        const {
            _currentLayout,
            _disableSelfView,
            _filmstripDisabled,
            _localScreenShareId,
            _mainFilmstripVisible,
            _resizableFilmstrip,
            _topPanelFilmstrip,
            _topPanelMaxHeight,
            _topPanelVisible,
            _verticalViewBackground,
            _verticalViewGrid,
            _verticalViewMaxWidth,
            filmstripType,
            t
        } = this.props;
        const classes = withStyles.getClasses(this.props);
        const { isMouseDown } = this.state;
        const tileViewActive = _currentLayout === LAYOUTS.TILE_VIEW;

        if (_currentLayout === LAYOUTS.STAGE_FILMSTRIP_VIEW && filmstripType === FILMSTRIP_TYPE.STAGE) {
            if (_topPanelFilmstrip) {
                filmstripStyle.maxHeight = `${_topPanelMaxHeight}px`;
                filmstripStyle.zIndex = 1;

                if (!_topPanelVisible) {
                    filmstripStyle.top = `-${_topPanelMaxHeight}px`;
                }
            }
            if (_mainFilmstripVisible) {
                filmstripStyle.maxWidth = `calc(100% - ${_verticalViewMaxWidth}px)`;
            }
        } else if (_currentLayout === LAYOUTS.STAGE_FILMSTRIP_VIEW && filmstripType === FILMSTRIP_TYPE.SCREENSHARE) {
            if (_mainFilmstripVisible) {
                filmstripStyle.maxWidth = `calc(100% - ${_verticalViewMaxWidth}px)`;
            }
            if (_topPanelVisible) {
                filmstripStyle.maxHeight = `calc(100% - ${_topPanelMaxHeight}px)`;
            }
            filmstripStyle.bottom = 0;
            filmstripStyle.top = 'auto';
        } else if (_currentLayout === LAYOUTS.VERTICAL_FILMSTRIP_VIEW
            || (_currentLayout === LAYOUTS.STAGE_FILMSTRIP_VIEW && filmstripType === FILMSTRIP_TYPE.MAIN)) {
            filmstripStyle.maxWidth = _verticalViewMaxWidth;
            if (!_mainFilmstripVisible) {
                filmstripStyle.right = `-${filmstripStyle.maxWidth}px`;
            }
        }

        let toolbar = null;

        if (!this.props._iAmRecorder && this.props._isFilmstripButtonEnabled
            && _currentLayout !== LAYOUTS.TILE_VIEW
            && ((filmstripType === FILMSTRIP_TYPE.MAIN && !_filmstripDisabled)
                || (filmstripType === FILMSTRIP_TYPE.STAGE && _topPanelFilmstrip))) {
            toolbar = this._renderToggleButton();
        }

        const filmstrip = (<>
            <div
                className = { clsx(this.props._videosClassName,
                    !tileViewActive && (filmstripType === FILMSTRIP_TYPE.MAIN
                    || (filmstripType === FILMSTRIP_TYPE.STAGE && _topPanelFilmstrip))
                    && !_resizableFilmstrip && 'filmstrip-hover',
                    _verticalViewGrid && 'vertical-view-grid') }
                id = 'remoteVideos'>
                {!_disableSelfView && !_verticalViewGrid && (
                    <div
                        className = 'filmstrip__videos'
                        id = 'filmstripLocalVideo'>
                        {
                            !tileViewActive && filmstripType === FILMSTRIP_TYPE.MAIN
                            && <div id = 'filmstripLocalVideoThumbnail'>
                                <Thumbnail
                                    filmstripType = { FILMSTRIP_TYPE.MAIN }
                                    key = 'local' />
                            </div>
                        }
                    </div>
                )}
                {_localScreenShareId && !_disableSelfView && !_verticalViewGrid && (
                    <div
                        className = 'filmstrip__videos'
                        id = 'filmstripLocalScreenShare'>
                        <div id = 'filmstripLocalScreenShareThumbnail'>
                            {
                                !tileViewActive && filmstripType === FILMSTRIP_TYPE.MAIN && <Thumbnail
                                    key = 'localScreenShare'
                                    participantID = { _localScreenShareId } />
                            }
                        </div>
                    </div>
                )}
                {
                    this._renderRemoteParticipants()
                }
            </div>
        </>);

        return (
            <div
                className = { clsx('filmstrip',
                    this.props._className,
                    classes.filmstrip,
                    _verticalViewGrid && 'no-vertical-padding',
                    _verticalViewBackground && classes.filmstripBackground) }
                style = { filmstripStyle }>
                <span
                    aria-level = { 1 }
                    className = 'sr-only'
                    role = 'heading'>
                    { t('filmstrip.accessibilityLabel.heading') }
                </span>
                { toolbar }
                {_resizableFilmstrip
                    ? <div
                        className = { clsx('resizable-filmstrip', classes.resizableFilmstripContainer,
                            _topPanelFilmstrip && 'top-panel-filmstrip') }>
                        <div
                            className = { clsx('dragHandleContainer',
                                classes.dragHandleContainer,
                                isMouseDown && 'visible',
                                _topPanelFilmstrip && 'top-panel')
                            }
                            onMouseDown = { this._onDragHandleMouseDown }>
                            <div className = { clsx(classes.dragHandle, 'dragHandle') } />
                        </div>
                        {filmstrip}
                    </div>
                    : filmstrip
                }
                <AudioTracksContainer />
            </div>
        );
    }

    /**
     * Handles mouse down on the drag handle.
     *
     * @param {MouseEvent} e - The mouse down event.
     * @returns {void}
     */
    _onDragHandleMouseDown(e: React.MouseEvent) {
        const { _topPanelFilmstrip, _topPanelHeight, _verticalFilmstripWidth } = this.props;

        this.setState({
            isMouseDown: true,
            mousePosition: _topPanelFilmstrip ? e.clientY : e.clientX,
            dragFilmstripWidth: _verticalFilmstripWidth || DEFAULT_FILMSTRIP_WIDTH,
            dragFilmstripHeight: _topPanelHeight || TOP_FILMSTRIP_HEIGHT
        });
        this.props.dispatch(setUserIsResizing(true));
    }

    /**
     * Drag handle mouse up handler.
     *
     * @returns {void}
     */
    _onDragMouseUp() {
        if (this.state.isMouseDown) {
            this.setState({
                isMouseDown: false
            });
            this.props.dispatch(setUserIsResizing(false));
        }
    }

    /**
     * Handles drag handle mouse move.
     *
     * @param {MouseEvent} e - The mousemove event.
     * @returns {void}
     */
    _onFilmstripResize(e: React.MouseEvent) {
        if (this.state.isMouseDown) {
            const {
                dispatch,
                _verticalFilmstripWidth,
                _maxFilmstripWidth,
                _topPanelHeight,
                _maxTopPanelHeight,
                _topPanelFilmstrip
            } = this.props;
            const { dragFilmstripWidth, dragFilmstripHeight, mousePosition } = this.state;

            if (_topPanelFilmstrip) {
                const diff = e.clientY - (mousePosition ?? 0);
                const height = Math.max(
                    Math.min((dragFilmstripHeight ?? 0) + diff, _maxTopPanelHeight),
                    TOP_FILMSTRIP_HEIGHT
                );

                if (height !== _topPanelHeight) {
                    dispatch(setUserFilmstripHeight(height));
                }
            } else {
                const diff = (mousePosition ?? 0) - e.clientX;
                const width = Math.max(
                    Math.min((dragFilmstripWidth ?? 0) + diff, _maxFilmstripWidth),
                    DEFAULT_FILMSTRIP_WIDTH
                );

                if (width !== _verticalFilmstripWidth) {
                    dispatch(setUserFilmstripWidth(width));
                }
            }
        }
    }

    /**
     * Calculates the start and stop indices based on whether the thumbnails need to be reordered in the filmstrip.
     *
     * @param {number} startIndex - The start index.
     * @param {number} stopIndex - The stop index.
     * @returns {Object}
     */
    _calculateIndices(startIndex: number, stopIndex: number) {
        const { _currentLayout, _iAmRecorder, _disableSelfView } = this.props;
        let start = startIndex;
        let stop = stopIndex;

        if (!_disableSelfView) {
            // In tile view, the indices needs to be offset by 1 because the first thumbnail is that of the local
            // endpoint. The remote participants start from index 1.
            if (!_iAmRecorder && _currentLayout === LAYOUTS.TILE_VIEW) {
                start = Math.max(startIndex - 1, 0);
                stop = stopIndex - 1;
            }
        }

        return {
            startIndex: start,
            stopIndex: stop
        };
    }

    /**
     * Toggle the toolbar visibility when tabbing into it.
     *
     * @returns {void}
     */
    _onTabIn() {
        if (!this.props._isToolboxVisible && this.props._mainFilmstripVisible) {
            this.props.dispatch(showToolbox());
        }
    }

    /**
     * The key to be used for every ThumbnailWrapper element in stage view.
     *
     * @param {number} index - The index of the ThumbnailWrapper instance.
     * @returns {string} - The key.
     */
    _listItemKey(index: number) {
        const { _remoteParticipants, _remoteParticipantsLength } = this.props;

        if (typeof index !== 'number' || _remoteParticipantsLength <= index) {
            return `empty-${index}`;
        }

        return _remoteParticipants[index];
    }

    /**
     * The key to be used for every ThumbnailWrapper element in tile views.
     *
     * @param {Object} data - An object with the indexes identifying the ThumbnailWrapper instance.
     * @returns {string} - The key.
     */
    _gridItemKey({ columnIndex, rowIndex }: { columnIndex: number; rowIndex: number; }): string {
        const {
            _disableSelfView,
            _columns,
            _iAmRecorder,
            _remoteParticipants,
            _remoteParticipantsLength
        } = this.props;
        const index = (rowIndex * _columns) + columnIndex;

        // When the thumbnails are reordered, local participant is inserted at index 0.
        const localIndex = _disableSelfView ? _remoteParticipantsLength : 0;
        const remoteIndex = !_iAmRecorder && !_disableSelfView ? index - 1 : index;

        if (index > _remoteParticipantsLength - (_iAmRecorder ? 1 : 0)) {
            return `empty-${index}`;
        }

        if (!_iAmRecorder && index === localIndex) {
            return 'local';
        }

        return _remoteParticipants[remoteIndex];
    }

    /**
     * Handles items rendered changes in stage view.
     *
     * @param {Object} data - Information about the rendered items.
     * @returns {void}
     */
    _onListItemsRendered({ visibleStartIndex, visibleStopIndex }: {
        visibleStartIndex: number; visibleStopIndex: number; }) {
        const { dispatch } = this.props;
        const { startIndex, stopIndex } = this._calculateIndices(visibleStartIndex, visibleStopIndex);

        dispatch(setVisibleRemoteParticipants(startIndex, stopIndex));
    }

    /**
     * Handles items rendered changes in tile view.
     *
     * @param {Object} data - Information about the rendered items.
     * @returns {void}
     */
    _onGridItemsRendered({
        visibleColumnStartIndex,
        visibleColumnStopIndex,
        visibleRowStartIndex,
        visibleRowStopIndex
    }: {
        visibleColumnStartIndex: number;
        visibleColumnStopIndex: number;
        visibleRowStartIndex: number;
        visibleRowStopIndex: number;
    }) {
        const { _columns, dispatch } = this.props;
        const start = (visibleRowStartIndex * _columns) + visibleColumnStartIndex;
        const stop = (visibleRowStopIndex * _columns) + visibleColumnStopIndex;
        const { startIndex, stopIndex } = this._calculateIndices(start, stop);

        dispatch(setVisibleRemoteParticipants(startIndex, stopIndex));
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
            _hasScroll,
            _isVerticalFilmstrip,
            _remoteParticipantsLength,
            _resizableFilmstrip,
            _rows,
            _thumbnailHeight,
            _thumbnailWidth,
            _verticalViewGrid,
            filmstripType
        } = this.props;

        if (!_thumbnailWidth || isNaN(_thumbnailWidth) || !_thumbnailHeight
            || isNaN(_thumbnailHeight) || !_filmstripHeight || isNaN(_filmstripHeight) || !_filmstripWidth
            || isNaN(_filmstripWidth)) {
            return null;
        }

        if (_currentLayout === LAYOUTS.TILE_VIEW || _verticalViewGrid || filmstripType !== FILMSTRIP_TYPE.MAIN) {
            return (
                <FixedSizeGrid
                    className = 'filmstrip__videos remote-videos'
                    columnCount = { _columns }
                    columnWidth = { _thumbnailWidth + TILE_HORIZONTAL_MARGIN }
                    height = { _filmstripHeight }
                    initialScrollLeft = { 0 }
                    initialScrollTop = { 0 }
                    itemData = {{ filmstripType }}
                    itemKey = { this._gridItemKey }
                    onItemsRendered = { this._onGridItemsRendered }
                    overscanRowCount = { 1 }
                    rowCount = { _rows }
                    rowHeight = { _thumbnailHeight + TILE_VERTICAL_MARGIN }
                    width = { _filmstripWidth }>
                    {
                        ThumbnailWrapper
                    }
                </FixedSizeGrid>
            );
        }


        const props: any = {
            itemCount: _remoteParticipantsLength,
            className: `filmstrip__videos remote-videos ${_resizableFilmstrip ? '' : 'height-transition'}`,
            height: _filmstripHeight,
            itemKey: this._listItemKey,
            itemSize: 0,
            onItemsRendered: this._onListItemsRendered,
            overscanCount: 1,
            width: _filmstripWidth,
            style: {
                willChange: 'auto'
            }
        };

        if (_currentLayout === LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW) {
            const itemSize = _thumbnailWidth + TILE_HORIZONTAL_MARGIN;
            const isNotOverflowing = !_hasScroll;

            props.itemSize = itemSize;
            props.layout = 'horizontal';
            if (isNotOverflowing) {
                props.className += ' is-not-overflowing';
            }

        } else if (_isVerticalFilmstrip) {
            const itemSize = _thumbnailHeight + TILE_VERTICAL_MARGIN;
            const isNotOverflowing = !_hasScroll;

            if (isNotOverflowing) {
                props.className += ' is-not-overflowing';
            }

            props.itemSize = itemSize;
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
        const { dispatch, _mainFilmstripVisible, _topPanelFilmstrip, _topPanelVisible } = this.props;

        _topPanelFilmstrip
            ? dispatch(setTopPanelVisible(!_topPanelVisible))
            : dispatch(setFilmstripVisible(!_mainFilmstripVisible));
    }

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
            ACTION_SHORTCUT_TRIGGERED,
            {
                enable: this.props._mainFilmstripVisible
            }));

        this._doToggleFilmstrip();
    }

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
                enable: this.props._mainFilmstripVisible
            }));

        this._doToggleFilmstrip();
    }

    /**
     * Handler for touch start event of the 'toggle button'.
     *
     * @private
     * @param {Object} e - The synthetic event.
     * @returns {void}
     */
    _onToggleButtonTouch(e: React.TouchEvent) {
        // Don't propagate the touchStart event so the toolbar doesn't get toggled.
        e.stopPropagation();
        this._onToolbarToggleFilmstrip();
    }

    /**
     * Creates a React Element for changing the visibility of the filmstrip when
     * clicked.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderToggleButton() {
        const {
            t,
            _isVerticalFilmstrip,
            _mainFilmstripVisible,
            _topPanelFilmstrip,
            _topPanelVisible
        } = this.props;
        const classes = withStyles.getClasses(this.props);
        const icon = (_topPanelFilmstrip ? _topPanelVisible : _mainFilmstripVisible) ? IconArrowDown : IconArrowUp;
        const actions = isMobileBrowser()
            ? { onTouchStart: this._onToggleButtonTouch }
            : { onClick: this._onToolbarToggleFilmstrip };

        return (
            <div
                className = { clsx(classes.toggleFilmstripContainer,
                    _isVerticalFilmstrip && classes.toggleVerticalFilmstripContainer,
                    _topPanelFilmstrip && classes.toggleTopPanelContainer,
                    _topPanelFilmstrip && !_topPanelVisible && classes.toggleTopPanelContainerHidden,
                    'toggleFilmstripContainer') }>
                <button
                    aria-expanded = { this.props._mainFilmstripVisible }
                    aria-label = { t('toolbar.accessibilityLabel.toggleFilmstrip') }
                    className = { classes.toggleFilmstripButton }
                    id = 'toggleFilmstripButton'
                    onFocus = { this._onTabIn }
                    tabIndex = { 0 }
                    { ...actions }>
                    <Icon
                        aria-label = { t('toolbar.accessibilityLabel.toggleFilmstrip') }
                        size = { 24 }
                        src = { icon } />
                </button>
            </div>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code Filmstrip}'s props.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState, ownProps: any) {
    const { _hasScroll = false, filmstripType, _topPanelFilmstrip, _remoteParticipants } = ownProps;
    const { toolbarButtons } = state['features/toolbox'];
    const { iAmRecorder } = state['features/base/config'];
    const { topPanelHeight, topPanelVisible, visible, width: verticalFilmstripWidth } = state['features/filmstrip'];
    const { localScreenShare } = state['features/base/participants'];
    const reduceHeight = state['features/toolbox'].visible && toolbarButtons?.length;
    const remoteVideosVisible = shouldRemoteVideosBeVisible(state);
    const { isOpen: shiftRight } = state['features/chat'];
    const disableSelfView = getHideSelfView(state);
    const { clientWidth, clientHeight } = state['features/base/responsive-ui'];
    const filmstripDisabled = isFilmstripDisabled(state);

    const collapseTileView = reduceHeight
        && isMobileBrowser()
        && clientWidth <= ASPECT_RATIO_BREAKPOINT;

    const shouldReduceHeight = reduceHeight && isMobileBrowser();
    const _topPanelVisible = isStageFilmstripTopPanel(state) && topPanelVisible;

    const notDisabled = visible && !filmstripDisabled;
    let isVisible = notDisabled || filmstripType !== FILMSTRIP_TYPE.MAIN;

    if (_topPanelFilmstrip) {
        isVisible = _topPanelVisible;
    }
    const videosClassName = `filmstrip__videos${isVisible ? '' : ' hidden'}${_hasScroll ? ' has-scroll' : ''}`;
    const className = `${remoteVideosVisible || ownProps._verticalViewGrid ? '' : 'hide-videos'} ${
        shouldReduceHeight ? 'reduce-height' : ''
    } ${shiftRight ? 'shift-right' : ''} ${collapseTileView ? 'collapse' : ''} ${isVisible ? '' : 'hidden'}`.trim();

    const _currentLayout = getCurrentLayout(state);
    const _isVerticalFilmstrip = _currentLayout === LAYOUTS.VERTICAL_FILMSTRIP_VIEW
        || (filmstripType === FILMSTRIP_TYPE.MAIN && _currentLayout === LAYOUTS.STAGE_FILMSTRIP_VIEW);

    return {
        _className: className,
        _chatOpen: state['features/chat'].isOpen,
        _currentLayout,
        _disableSelfView: disableSelfView,
        _filmstripDisabled: filmstripDisabled,
        _hasScroll,
        _iAmRecorder: Boolean(iAmRecorder),
        _isFilmstripButtonEnabled: isButtonEnabled('filmstrip', state),
        _isToolboxVisible: isToolboxVisible(state),
        _isVerticalFilmstrip,
        _localScreenShareId: localScreenShare?.id,
        _mainFilmstripVisible: notDisabled,
        _maxFilmstripWidth: clientWidth - MIN_STAGE_VIEW_WIDTH,
        _maxTopPanelHeight: clientHeight - MIN_STAGE_VIEW_HEIGHT,
        _remoteParticipantsLength: _remoteParticipants?.length ?? 0,
        _topPanelHeight: topPanelHeight.current,
        _topPanelMaxHeight: topPanelHeight.current || TOP_FILMSTRIP_HEIGHT,
        _topPanelVisible,
        _verticalFilmstripWidth: verticalFilmstripWidth.current,
        _verticalViewMaxWidth: getVerticalViewMaxWidth(state),
        _videosClassName: videosClassName
    };
}

export default withStyles(translate(connect(_mapStateToProps)(Filmstrip)), styles);
