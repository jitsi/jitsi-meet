import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import Icon from '../../../base/icons/components/Icon';
import {
    IconArrowDown,
    IconArrowUp,
    IconCloseLarge,
    IconPlus
} from '../../../base/icons/svg';
import {
    setFollowingPresenter,
    setLocalPage,
    setLocalScale,
    setPointerCoordinates,
    setPresenterPage,
    stopPdfPresentation
} from '../../actions';
import { LASER_POINTER_TIMEOUT_MS } from '../../constants';
import { isLocalUserPdfPresenter } from '../../functions';

const useStyles = makeStyles()(theme => {
    return {
        container: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#141414',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        },

        header: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            color: '#fff',
            zIndex: 20
        },

        title: {
            fontSize: '14px',
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '300px'
        },

        controls: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },

        button: {
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '4px',
            color: '#fff',
            cursor: 'pointer',
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '13px',
            transition: 'background 0.2s',

            '&:hover': {
                background: 'rgba(255, 255, 255, 0.2)'
            },

            '&:disabled': {
                opacity: 0.4,
                cursor: 'not-allowed'
            }
        },

        refollowButton: {
            background: theme.palette.action01,
            fontWeight: 600,

            '&:hover': {
                background: theme.palette.action01Hover
            }
        },

        viewerWrapper: {
            flex: 1,
            position: 'relative',
            overflow: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'crosshair'
        },

        canvas: {
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
            display: 'block',
            maxWidth: '100%'
        },

        laserPointer: {
            position: 'absolute',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            backgroundColor: '#ff3344',
            boxShadow: '0 0 10px #ff3344, 0 0 20px #ff3344',
            pointerEvents: 'none',
            transform: 'translate(-50%, -50%)',
            transition: 'left 0.05s ease-out, top 0.05s ease-out',
            zIndex: 30
        },

        loading: {
            color: '#fff',
            fontSize: '16px'
        }
    };
});

/**
 * PDF Viewer component with synchronized pages and laser pointer.
 */
const PdfViewer = () => {
    const { classes } = useStyles();
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const viewerRef = useRef<HTMLDivElement | null>(null);

    const pdfState = useSelector((state: IReduxState) => state['features/pdf-sharing']);
    const isPresenter = useSelector(isLocalUserPdfPresenter);

    const {
        pdfUrl,
        pdfTitle,
        presenterPage,
        localPage,
        totalPages,
        isFollowingPresenter,
        pointer,
        scale
    } = pdfState;

    const [ pdfDoc, setPdfDoc ] = useState<any>(null);
    const [ docTotalPages, setDocTotalPages ] = useState<number>(totalPages || 1);
    const [ isLoading, setIsLoading ] = useState<boolean>(true);
    const [ activePointer, setActivePointer ] = useState<any>(null);

    const pointerTimeoutRef = useRef<any>(null);

    // Load PDF document dynamically using pdfjs-dist
    useEffect(() => {
        let isCancelled = false;

        async function loadPdf() {
            if (!pdfUrl) {
                return;
            }

            try {
                setIsLoading(true);
                const pdfjs = await import(/* webpackChunkName: "pdfjs-dist" */ 'pdfjs-dist');

                // Configure standard worker
                if (!pdfjs.GlobalWorkerOptions.workerSrc) {
                    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
                }

                const loadingTask = pdfjs.getDocument(pdfUrl);
                const doc = await loadingTask.promise;

                if (!isCancelled) {
                    setPdfDoc(doc);
                    setDocTotalPages(doc.numPages);
                    setIsLoading(false);
                }
            } catch (error) {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        }

        loadPdf();

        return () => {
            isCancelled = true;
        };
    }, [ pdfUrl ]);

    // Render the current page onto the canvas
    useEffect(() => {
        let isCancelled = false;

        async function renderPage() {
            if (!pdfDoc || !canvasRef.current) {
                return;
            }

            const pageNum = isFollowingPresenter ? presenterPage : localPage;

            try {
                const page = await pdfDoc.getPage(pageNum);
                const viewport = page.getViewport({ scale });
                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');

                if (!context || isCancelled) {
                    return;
                }

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                    canvasContext: context,
                    viewport
                };

                await page.render(renderContext).promise;
            } catch (err) {
                // Rendering cancelled or error
            }
        }

        renderPage();

        return () => {
            isCancelled = true;
        };
    }, [ pdfDoc, presenterPage, localPage, isFollowingPresenter, scale ]);

    // Manage laser pointer expiration
    useEffect(() => {
        if (!pointer) {
            setActivePointer(null);

            return;
        }

        const pageNum = isFollowingPresenter ? presenterPage : localPage;

        if (pointer.pageNumber === pageNum) {
            setActivePointer(pointer);

            if (pointerTimeoutRef.current) {
                clearTimeout(pointerTimeoutRef.current);
            }

            pointerTimeoutRef.current = setTimeout(() => {
                setActivePointer(null);
            }, LASER_POINTER_TIMEOUT_MS);
        } else {
            setActivePointer(null);
        }

        return () => {
            if (pointerTimeoutRef.current) {
                clearTimeout(pointerTimeoutRef.current);
            }
        };
    }, [ pointer, presenterPage, localPage, isFollowingPresenter ]);

    // Presenter mouse movement broadcast for laser pointer
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!isPresenter || !canvasRef.current) {
            return;
        }

        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
            dispatch(setPointerCoordinates({
                x,
                y,
                pageNumber: presenterPage,
                timestamp: Date.now()
            }));
        }
    }, [ isPresenter, presenterPage, dispatch ]);

    const handleNextPage = useCallback(() => {
        const currentPage = isFollowingPresenter ? presenterPage : localPage;

        if (currentPage < docTotalPages) {
            const next = currentPage + 1;

            if (isPresenter) {
                dispatch(setPresenterPage(next));
            } else {
                dispatch(setLocalPage(next));
            }
        }
    }, [ isFollowingPresenter, presenterPage, localPage, docTotalPages, isPresenter, dispatch ]);

    const handlePrevPage = useCallback(() => {
        const currentPage = isFollowingPresenter ? presenterPage : localPage;

        if (currentPage > 1) {
            const prev = currentPage - 1;

            if (isPresenter) {
                dispatch(setPresenterPage(prev));
            } else {
                dispatch(setLocalPage(prev));
            }
        }
    }, [ isFollowingPresenter, presenterPage, localPage, isPresenter, dispatch ]);

    const handleReFollow = useCallback(() => {
        dispatch(setFollowingPresenter(true));
    }, [ dispatch ]);

    const handleZoomIn = useCallback(() => {
        dispatch(setLocalScale(Math.min(scale + 0.25, 3.0)));
    }, [ scale, dispatch ]);

    const handleZoomOut = useCallback(() => {
        dispatch(setLocalScale(Math.max(scale - 0.25, 0.5)));
    }, [ scale, dispatch ]);

    const handleClose = useCallback(() => {
        dispatch(stopPdfPresentation());
    }, [ dispatch ]);

    const currentPage = isFollowingPresenter ? presenterPage : localPage;

    return (
        <div className = { classes.container }>
            <div className = { classes.header }>
                <div className = { classes.title }>
                    { pdfTitle || t('pdfSharing.defaultTitle') }
                </div>

                <div className = { classes.controls }>
                    { !isPresenter && !isFollowingPresenter && (
                        <button
                            className = { `${classes.button} ${classes.refollowButton}` }
                            onClick = { handleReFollow }>
                            { t('pdfSharing.reFollowPresenter') }
                        </button>
                    ) }

                    <button
                        className = { classes.button }
                        disabled = { currentPage <= 1 }
                        onClick = { handlePrevPage }>
                        <Icon
                            size = { 16 }
                            src = { IconArrowUp } />
                    </button>

                    <span>
                        { `${currentPage} / ${docTotalPages}` }
                    </span>

                    <button
                        className = { classes.button }
                        disabled = { currentPage >= docTotalPages }
                        onClick = { handleNextPage }>
                        <Icon
                            size = { 16 }
                            src = { IconArrowDown } />
                    </button>

                    <button
                        className = { classes.button }
                        onClick = { handleZoomOut }
                        title = 'Zoom out'>
                        -
                    </button>

                    <span>{ `${Math.round(scale * 100)}%` }</span>

                    <button
                        className = { classes.button }
                        onClick = { handleZoomIn }
                        title = 'Zoom in'>
                        <Icon
                            size = { 16 }
                            src = { IconPlus } />
                    </button>

                    { isPresenter && (
                        <button
                            className = { classes.button }
                            onClick = { handleClose }
                            title = { t('pdfSharing.stopSharing') }>
                            <Icon
                                size = { 16 }
                                src = { IconCloseLarge } />
                        </button>
                    ) }
                </div>
            </div>

            <div
                className = { classes.viewerWrapper }
                onMouseMove = { handleMouseMove }
                ref = { viewerRef }>
                { isLoading ? (
                    <div className = { classes.loading }>
                        { t('pdfSharing.loading') }
                    </div>
                ) : (
                    <div style = {{ position: 'relative' }}>
                        <canvas
                            className = { classes.canvas }
                            ref = { canvasRef } />

                        { activePointer && canvasRef.current && (
                            <div
                                className = { classes.laserPointer }
                                style = {{
                                    left: `${activePointer.x * 100}%`,
                                    top: `${activePointer.y * 100}%`
                                }} />
                        ) }
                    </div>
                ) }
            </div>
        </div>
    );
};

export default PdfViewer;
