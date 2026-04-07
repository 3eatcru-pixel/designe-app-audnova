/**
 * HyperDashboard Component
 * Displays Hyper balance, level, generosity, and transaction history
 */

import React from 'react';
import { User } from '../types';
import { HyperService } from '../services/HyperService';
import { Card } from './Card';
import { Button } from './Button';
import { Zap, Crown, Heart, TrendingUp } from 'lucide-react';

interface HyperDashboardProps {
    user: User;
    onDonate?: () => void;
    onCreateInvite?: () => void;
    compact?: boolean;
}

export const HyperDashboard: React.FC<HyperDashboardProps> = ({
    user,
    onDonate,
    onCreateInvite,
    compact = false,
}) => {
    const levelTitle = HyperService.getLevelTitle(user.hyperLevel);
    const levelEmoji = user.hyperLevel === 3 ? '👑' : user.hyperLevel === 2 ? '⭐' : '🎵';
    const donatedCount = user.generosity.donationCount;

    if (compact) {
        // Minimal card for ProfilePage
        return (
            <Card className="p-4 bg-gradient-to-br from-neon-cyan/10 to-purple-500/10" variant="default">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white">💫 Hyper Economy</h3>
                    <span className="text-2xl font-black text-neon-cyan">{HyperService.formatHypers(user.hypers)}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-white/5">
                        <p className="text-[10px] text-white/60 uppercase font-bold tracking-wider">Level</p>
                        <p className="text-sm font-bold text-white">{levelEmoji} {levelTitle}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5">
                        <p className="text-[10px] text-white/60 uppercase font-bold tracking-wider">Max Radios</p>
                        <p className="text-sm font-bold text-neon-cyan">{user.maxActiveRadios}</p>
                    </div>
                </div>

                <div className="p-2 rounded-lg bg-white/5 mb-3">
                    <p className="text-[10px] text-white/60 uppercase font-bold tracking-wider">Generosity</p>
                    <p className="text-xs text-white mt-1">
                        ❤️ {donatedCount} doações • {user.generosity.totalDonated} Hypers
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1 text-[11px] h-8 gap-1"
                        onClick={onCreateInvite}
                    >
                        <Zap size={12} />
                        Convite
                    </Button>
                    <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1 text-[11px] h-8 gap-1"
                        onClick={onDonate}
                    >
                        <Heart size={12} />
                        Doar
                    </Button>
                </div>
            </Card>
        );
    }

    // Full dashboard
    return (
        <div className="flex flex-col gap-4">
            {/* Balance Header */}
            <Card className="p-6 bg-gradient-to-br from-neon-cyan/20 to-purple-500/20 border border-neon-cyan/30" variant="default">
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-xs text-white/60 uppercase tracking-widest font-bold mb-2">Saldo Atual</p>
                        <h2 className="text-5xl font-black text-neon-cyan">{HyperService.formatHypers(user.hypers)}</h2>
                        <p className="text-xs text-white/40 mt-2">Histórico: {user.hyperHistoryLifetime} Hypers earned</p>
                    </div>
                    <div className="text-6xl">{levelEmoji}</div>
                </div>
            </Card>

            {/* Level & Limits */}
            <Card className="p-4" variant="default">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <TrendingUp size={16} /> Nível & Limites
                </h3>

                <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                        <span className="text-sm text-white">{levelEmoji} Seu Nível</span>
                        <span className="text-sm font-bold text-neon-cyan">{levelTitle}</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                        <span className="text-sm text-white">📻 Rádios Ativas</span>
                        <span className="text-sm font-bold text-neon-cyan">{user.maxActiveRadios} máx</span>
                    </div>

                    {user.hyperLevel < 3 && (
                        <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                            <p className="text-xs text-white/80">
                                {user.hyperLevel === 1
                                    ? `🎯 Ganhe 1+ Hypers para desbloquear Nível 2 (2 rádios)`
                                    : `🎯 Ganhe 50+ Hypers para desbloquear Nível 3 Archon (3+ rádios)`}
                            </p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Generosity Stats */}
            <Card className="p-4" variant="default">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Heart size={16} className="text-red-400" /> Generosidade
                </h3>

                <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                        <span className="text-sm text-white">Total Doado</span>
                        <span className="text-sm font-bold text-red-400">{user.generosity.totalDonated} Hypers</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                        <span className="text-sm text-white">Doações</span>
                        <span className="text-sm font-bold text-neon-cyan">{donatedCount}</span>
                    </div>

                    {user.badges.filter(b => ['supporter', 'patrono', 'archon_benefactor'].includes(b.id)).length > 0 && (
                        <div className="p-2 rounded-lg bg-yellow-500/20 border border-yellow-500/30 mt-2">
                            <p className="text-xs text-yellow-200 font-bold">🏆 Badges Conquistados</p>
                            <div className="flex gap-1 mt-1 flex-wrap">
                                {user.badges
                                    .filter(b => ['supporter', 'patrono', 'archon_benefactor'].includes(b.id))
                                    .map(b => (
                                        <span key={b.id} className="text-xs bg-yellow-500/30 px-2 py-1 rounded">
                                            {b.icon} {b.name}
                                        </span>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Recent Hyper Transactions */}
            {user.hyperTransactions.length > 0 && (
                <Card className="p-4" variant="default">
                    <h3 className="text-sm font-bold text-white mb-3">Transações Recentes</h3>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {user.hyperTransactions.slice(0, 10).map(tx => {
                            const icon = tx.type === 'earn' ? '✅' : tx.type === 'donate' ? '❤️' : '💫';
                            const color = tx.type === 'earn' ? 'text-green-400' : 'text-red-400';

                            return (
                                <div key={tx.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 text-xs">
                                    <div className="flex items-center gap-2">
                                        <span>{icon}</span>
                                        <span className="text-white/80">{tx.description}</span>
                                    </div>
                                    <span className={`font-bold ${color}`}>
                                        {tx.type === 'earn' ? '+' : '-'}{tx.amount}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
                <Button
                    variant="secondary"
                    className="gap-2 border-neon-cyan/30 hover:border-neon-cyan/50"
                    onClick={onCreateInvite}
                >
                    <Zap size={16} />
                    <div className="text-left">
                        <p className="text-[10px] font-bold text-white/60">Gerar Convite</p>
                        <p className="text-xs font-bold">-1 Hyper</p>
                    </div>
                </Button>

                <Button
                    variant="secondary"
                    className="gap-2 border-red-500/30 hover:border-red-500/50"
                    onClick={onDonate}
                >
                    <Heart size={16} className="text-red-400" />
                    <div className="text-left">
                        <p className="text-[10px] font-bold text-white/60">Doar para DJ</p>
                        <p className="text-xs font-bold">-1 Hyper</p>
                    </div>
                </Button>
            </div>
        </div>
    );
};
