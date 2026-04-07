/**
 * P2PChatPage - Improved 1:1 Chat with E2EE
 * Now uses RatchetService for Double Ratchet encryption
 */

import React from 'react';
import P2PChatIntegrated from './P2PChatIntegrated';
import { User, Page } from '../types';

interface P2PChatPageProps {
    friendId: string | null;
    onPageChange: (page: Page) => void;
}

/**
 * Adapter: P2PChatPage delegates to P2PChatIntegrated
 * Maintains existing interface while using real E2EE
 */
export const P2PChatPage: React.FC<P2PChatPageProps> = ({ friendId, onPageChange }) => {
    // Use friendId if provided, otherwise use a default peer
    const peerId = friendId || 'peer-default';

    return (
        <div className="flex flex-col h-full">
            <P2PChatIntegrated peerId={peerId} />
        </div>
    );
};

export default P2PChatPage;
