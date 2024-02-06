import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * The type of the React {@code Component} props of {@link NoWhiteboardError}.
 */
interface IProps {

    /**
     * Additional CSS classnames to append to the root of the component.
     */
    className?: string;
}

const NoWhiteboardError = ({ className }: IProps) => {
    const { t } = useTranslation();

    return (
        <div className = { className } >
            {t('info.noWhiteboard')}
        </div>
    );
};

export default NoWhiteboardError;
