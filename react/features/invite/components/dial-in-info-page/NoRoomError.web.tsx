import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * The type of the React {@code Component} props of {@link NoRoomError}.
 */
interface IProps {

    /**
     * Additional CSS classnames to append to the root of the component.
     */
    className: string;
}

const NoRoomError = ({ className }: IProps) => {
    const { t } = useTranslation();

    return (
        <div className = { className } >
            <div>{t('info.noNumbers')}</div>
            <div>{t('info.noRoom')}</div>
        </div>
    );
};

export default NoRoomError;
