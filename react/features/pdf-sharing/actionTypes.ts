/**
 * Action type to set the PDF presentation status (URL, owner, page count, etc.).
 */
export const SET_PDF_PRESENTATION_STATUS = 'SET_PDF_PRESENTATION_STATUS';

/**
 * Action type to reset/stop the PDF presentation.
 */
export const RESET_PDF_PRESENTATION = 'RESET_PDF_PRESENTATION';

/**
 * Action type to set the current presenter page number.
 */
export const SET_PDF_PRESENTER_PAGE = 'SET_PDF_PRESENTER_PAGE';

/**
 * Action type to set the local viewer page number (when independent or following).
 */
export const SET_PDF_LOCAL_PAGE = 'SET_PDF_LOCAL_PAGE';

/**
 * Action type to set whether the local viewer is actively following the presenter.
 */
export const SET_PDF_FOLLOWING_PRESENTER = 'SET_PDF_FOLLOWING_PRESENTER';

/**
 * Action type to update the presenter laser pointer coordinates.
 */
export const SET_PDF_POINTER_COORDINATES = 'SET_PDF_POINTER_COORDINATES';

/**
 * Action type to set the local zoom scale.
 */
export const SET_PDF_LOCAL_SCALE = 'SET_PDF_LOCAL_SCALE';
