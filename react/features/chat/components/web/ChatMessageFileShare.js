// @flow

import Spinner from '@atlaskit/spinner';
import React, { useMemo, useCallback, useState, useEffect } from 'react';

import { IconDownload, IconDeviceDocument, IconPdf } from '../../../base/icons';

type Props = {
    url: string
}

const parseFileShareUrl = (url: string) => {
    const searchParams = new URLSearchParams(url.substring(url.indexOf('?')));

    return {
        mimeType: searchParams.get('mimeType'),
        fileName: searchParams.get('fileName')
    };
};

const parsedMimeTypes = mimeType => {
    if (mimeType.startsWith('image')) {
        return 'image/*';
    }

    return mimeType;

};

const getThumbnail = url => fetch(url);

const ChatMessageFileShare = ({ url }: Props) => {
    const {
        mimeType,
        fileName
    } = useMemo(() => parseFileShareUrl(url), [ url ]);

    const [ isDownloading, setIsDownloading ] = useState(false);
    const [ thumbnailUrl, setThumbnailUrl ] = useState(null);

    useEffect(() => {
        if (!mimeType.startsWith('image/')) {
            return;
        }

        const fetchThumbnail = async () => {
            let counter = 0;
            const thumbnail = url.replace('files', 'thumbnails');
            const intervalHandle = setInterval(async () => {
                counter++;
                const resp = await getThumbnail(thumbnail);

                if (resp.ok && resp.headers.get('content-length') > 0) {
                    setThumbnailUrl(thumbnail);
                    clearInterval(intervalHandle);

                    return;
                }
                if (counter > 3) {
                    clearInterval(intervalHandle);
                }
            }, 3000);
        };

        fetchThumbnail();
    }, [ url, mimeType ]);

    const download = useCallback(() => {
        setIsDownloading(true);
        fetch(url)
            .then(res => res.blob())
            .then(blob => {
                setIsDownloading(false);
                const base64Url = window.URL.createObjectURL(blob);

                // fake a anchor tag
                const a = document.createElement('a');

                a.href = base64Url;
                a.download = fileName;
                a.click();
            });
    }, []);


    return isDownloading ? <Spinner /> : (
        <div
            className = 'file-share-message-container'>
            {
                {
                    'application/pdf': <IconPdf
                        className = 'file-share-icon' />,
                    'image/*': <img
                        className = 'file-share-thumbnail'
                        src = { thumbnailUrl } />
                }[parsedMimeTypes(mimeType)] || <IconDeviceDocument
                    className = 'file-share-icon white' />
            }

            <div
                className = 'file-share-download-pane'
                onClick = { download }>
                <IconDownload
                    className = 'file-share-icon-download' />
                { fileName }
            </div>
        </div>
    );
};

export default ChatMessageFileShare;
