/**
 * HyperService - AntiGravity Economy Manager
 * Manages Hyper currency, progression, donations, and badges
 */

import { User, HyperTransaction, HyperLevel, Badge } from '../types';
import { HYPER_CONFIG, GENEROSITY_BADGES } from '../constants';

export class HyperService {
    /**
     * Calculate user's Hyper Level based on lifetime history
     */
    static calculateHyperLevel(lifetimeHypers: number): HyperLevel {
        const thresholds = HYPER_CONFIG.LEVEL_THRESHOLDS;

        if (lifetimeHypers >= thresholds[3].min) return 3;
        if (lifetimeHypers >= thresholds[2].min) return 2;
        return 1;
    }

    /**
     * Get max radios allowed for user based on their level
     */
    static getMaxRadiosForLevel(level: HyperLevel): number {
        return HYPER_CONFIG.LEVEL_THRESHOLDS[level].maxRadios;
    }

    /**
     * Handle daily Hyper reset (3 Hypers at UTC midnight)
     * Returns updated user with new balance
     */
    static handleDailyReset(user: User): User {
        const now = new Date();
        const userLastReset = new Date(user.lastDailyResetAt);

        // Check if it's a new day (UTC)
        const isNewDay =
            now.getUTCDate() !== userLastReset.getUTCDate() ||
            now.getUTCMonth() !== userLastReset.getUTCMonth() ||
            now.getUTCFullYear() !== userLastReset.getUTCFullYear();

        if (!isNewDay || user.hyperLevel === 1) { // Guests don't get daily grant
            return user;
        }

        const newTransaction: HyperTransaction = {
            id: `hyper-daily-${Date.now()}`,
            type: 'earn',
            amount: HYPER_CONFIG.DAILY_GRANT,
            action: 'daily_grant',
            description: `Recarga Diária: ${HYPER_CONFIG.DAILY_GRANT} Hypers`,
            timestamp: new Date().toISOString(),
        };

        return {
            ...user,
            hypers: HYPER_CONFIG.DAILY_GRANT, // Reset to 3
            hyperHistoryLifetime: user.hyperHistoryLifetime + HYPER_CONFIG.DAILY_GRANT,
            hyperTransactions: [...user.hyperTransactions, newTransaction],
            lastDailyResetAt: new Date().toISOString(),
        };
    }

    /**
     * Spend Hypers for an action (invite, donation, etc)
     */
    static spendHypers(
        user: User,
        amount: number,
        action: HyperTransaction['action'],
        description: string,
        targetRadioId?: string,
        targetUserId?: string
    ): { success: boolean; user?: User; error?: string } {
        if (user.hypers < amount) {
            return { success: false, error: `Você precisa de ${amount} Hypers. Você tem ${user.hypers}.` };
        }

        const newTransaction: HyperTransaction = {
            id: `hyper-spend-${Date.now()}`,
            type: 'spend',
            amount: amount,
            action: action,
            description: description,
            timestamp: new Date().toISOString(),
            targetRadioId,
            targetUserId,
        };

        return {
            success: true,
            user: {
                ...user,
                hypers: user.hypers - amount,
                hyperTransactions: [...user.hyperTransactions, newTransaction],
            },
        };
    }

    /**
     * Donate Hypers to a radio (support DJ)
     */
    static donateToRadio(
        user: User,
        radioId: string,
        radioHostId: string
    ): { success: boolean; user?: User; error?: string } {
        const spend = this.spendHypers(
            user,
            HYPER_CONFIG.RADIO_DONATE_COST,
            'radio_donate',
            `Doação para rádio ${radioId}`,
            radioId,
            radioHostId
        );

        if (!spend.success) {
            return spend;
        }

        // Update generosity record
        const updatedUser = spend.user!;
        updatedUser.generosity = {
            ...updatedUser.generosity,
            totalDonated: updatedUser.generosity.totalDonated + HYPER_CONFIG.RADIO_DONATE_COST,
            donationCount: updatedUser.generosity.donationCount + 1,
            lastDonationAt: new Date().toISOString(),
        };

        // Check if should earn generosity badge
        const badge = this.checkGenerosityBadge(updatedUser);
        if (badge && !updatedUser.badges.find(b => b.id === badge.id)) {
            updatedUser.badges = [...updatedUser.badges, badge];
        }

        return { success: true, user: updatedUser };
    }

    /**
     * Create an invite (costs 1 Hyper)
     */
    static createInvite(user: User): { success: boolean; inviteCode?: string; user?: User; error?: string } {
        const spend = this.spendHypers(
            user,
            HYPER_CONFIG.INVITE_CREATE_COST,
            'invite_create',
            'Geração de Código de Convite'
        );

        if (!spend.success) {
            return spend;
        }

        // Generate invite code: AG-XXXX
        const inviteCode = `AG-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        return {
            success: true,
            inviteCode,
            user: spend.user,
        };
    }

    /**
     * Check if user qualifies for a generosity badge
     */
    static checkGenerosityBadge(user: User): Badge | null {
        const donated = user.generosity.totalDonated;

        // Check badges in reverse order (highest first)
        for (let i = GENEROSITY_BADGES.length - 1; i >= 0; i--) {
            const badge = GENEROSITY_BADGES[i];

            // Count donations for this badge (check id pattern)
            if (badge.id === 'archon_benefactor' && donated >= 50) return badge;
            if (badge.id === 'patrono' && donated >= 10) return badge;
            if (badge.id === 'supporter' && donated >= 1) return badge;
        }

        return null;
    }

    /**
     * Format Hyper balance for display
     */
    static formatHypers(amount: number): string {
        return `💫 ${amount}`;
    }

    /**
     * Get user's level badge/title
     */
    static getLevelTitle(level: HyperLevel): string {
        switch (level) {
            case 1:
                return 'Listener';
            case 2:
                return 'Collaborator';
            case 3:
                return 'Archon';
            default:
                return 'Guest';
        }
    }

    /**
     * Get user's level description with radio limit
     */
    static getLevelDescription(level: HyperLevel): string {
        const maxRadios = this.getMaxRadiosForLevel(level);
        const emoji = level === 3 ? '👑' : level === 2 ? '⭐' : '🎵';
        return `${emoji} ${this.getLevelTitle(level)} • ${maxRadios} rádio(s) max`;
    }

    /**
     * Check if user can create another radio
     */
    static canCreateRadio(user: User, currentActivRadios: number): boolean {
        return currentActivRadios < user.maxActiveRadios;
    }

    /**
     * Batch-check radios for featuring (100+ Hypers in 24h)
     */
    static markFeaturedRadios(radioIds: string[], hypersDonated: Record<string, number>) {
        return radioIds.map(id => ({
            id,
            isFeatured: (hypersDonated[id] || 0) >= HYPER_CONFIG.FEATURED_THRESHOLD_HYPERS,
            visibilityBoost: (hypersDonated[id] || 0) >= HYPER_CONFIG.FEATURED_THRESHOLD_HYPERS
                ? HYPER_CONFIG.FEATURED_VISIBILITY_BOOST
                : 1,
        }));
    }
}
