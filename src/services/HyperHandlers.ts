/**
 * Hyper Handlers for App State Management
 * Bridge between HyperService logic and React state
 */

import { User, HyperTransaction } from '../types';
import { HyperService } from './HyperService';

export const registerHyperHandlers = () => {
    return {
        /**
         * Create invite code (costs 1 Hyper)
         */
        handleCreateInvite: (user: User) => {
            return HyperService.createInvite(user);
        },

        /**
         * Donate to radio (costs 1 Hyper, adds to generosity)
         */
        handleDonateToRadio: (user: User, radioId: string, radioHostId: string) => {
            return HyperService.donateToRadio(user, radioId, radioHostId);
        },

        /**
         * Check daily reset needed
         */
        handleDailyReset: (user: User) => {
            return HyperService.handleDailyReset(user);
        },

        /**
         * Manually spend Hypers for custom actions
         */
        handleSpendHypers: (user: User, amount: number, description: string, action: HyperTransaction['action']) => {
            return HyperService.spendHypers(user, amount, action, description);
        },

        /**
         * Earn Hypers (daily bonus, achievements, etc)
         */
        handleEarnHypers: (user: User, amount: number, description: string) => {
            const now = new Date();
            const tx: HyperTransaction = {
                id: `hyper-earn-${Date.now()}`,
                type: 'earn',
                amount: amount,
                action: 'other',
                description: description,
                timestamp: now.toISOString(),
            };

            return {
                ...user,
                hypers: user.hypers + amount,
                hyperHistoryLifetime: user.hyperHistoryLifetime + amount,
                hyperTransactions: [...user.hyperTransactions, tx],
            };
        },

        /**
         * Format display
         */
        formatHypers: HyperService.formatHypers,
        getLevelTitle: HyperService.getLevelTitle,
        getLevelDescription: HyperService.getLevelDescription,
        canCreateRadio: HyperService.canCreateRadio,
    };
};
