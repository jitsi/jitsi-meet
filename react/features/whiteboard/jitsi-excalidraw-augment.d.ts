/**
 * Ensures augmentation merges with the real `@jitsi/excalidraw` typings (see
 * TypeScript handbook: module augmentation).
 */
import type {} from '@jitsi/excalidraw';

declare module '@jitsi/excalidraw' {
    interface ExcalidrawAppProps {
        jwt?: string;
        meetingDetails?: {
            jwt: string;
            roomJid: string;
            sessionId: string;
        };
        storageBackendUrl?: string;
    }
}
