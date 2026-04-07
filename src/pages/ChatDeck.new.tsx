/**
 * ChatDeck - Improved Chat Page with Real Services
 * Now uses RadioService + MessageService for real data
 */

import React from 'react';
import ChatDeckIntegrated from './ChatDeckIntegrated';
import { Message, Radio, AuthMode } from '../types';

interface ChatDeckProps {
    authMode: AuthMode;
    selectedRadio: Radio | null;
    isDJMode?: boolean;
    onClose?: () => void;
    isConfigOpen?: boolean;
    setIsConfigOpen?: (val: boolean) => void;
    onFavoriteRadio?: (radioId: string) => void;
    userFavorites?: string[];
    onSpendHypers?: (amount: number, description: string) => void;
    userHypers?: number;
}

/**
 * Adapter: ChatDeck now delegates to ChatDeckIntegrated
 * This maintains the existing interface while using real services
 */
export const ChatDeck: React.FC<ChatDeckProps> = ({
    authMode,
    selectedRadio,
    isDJMode = false,
    onClose,
    isConfigOpen = false,
    setIsConfigOpen,
    onFavoriteRadio,
    userFavorites = [],
    onSpendHypers,
    userHypers = 0,
}) => {
    // Wrapper to maintain existing props but use integrated version
    return (
        <div className="flex flex-col h-full">
            <ChatDeckIntegrated />
        </div>
    );
};

export default ChatDeck;
