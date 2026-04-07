/**
 * AudNova - Badge Verification Page
 * Displays all available badges, unlock requirements, and user's collection
 */

import React, { useState } from 'react';
import { CheckCircle, Lock, Star, Trophy, Award, Target } from 'lucide-react';

interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'achievement' | 'social' | 'audio' | 'network';
    unlockedAt?: Date;
    requirementType: 'messages' | 'connections' | 'broadcasts' | 'hours' | 'quality';
    requirementValue: number;
    requirementMet: number;
    color: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

const MOCK_BADGES: Badge[] = [
    {
        id: 'first_message',
        name: 'First Broadcast',
        description: 'Send your first encrypted message',
        icon: '📨',
        category: 'achievement',
        unlockedAt: new Date('2026-03-15'),
        requirementType: 'messages',
        requirementValue: 1,
        requirementMet: 1,
        color: 'blue',
        rarity: 'common',
    },
    {
        id: 'chatty',
        name: 'Chatty Cathy',
        description: 'Send 100+ messages in a session',
        icon: '💬',
        category: 'achievement',
        unlockedAt: new Date('2026-03-20'),
        requirementType: 'messages',
        requirementValue: 100,
        requirementMet: 245,
        color: 'green',
        rarity: 'uncommon',
    },
    {
        id: 'connector',
        name: 'Network Connector',
        description: 'Establish 10+ peer connections',
        icon: '🌐',
        category: 'social',
        requirementType: 'connections',
        requirementValue: 10,
        requirementMet: 3,
        color: 'purple',
        rarity: 'uncommon',
    },
    {
        id: 'radio_master',
        name: 'Radio Master',
        description: 'Broadcast on 5 different channels',
        icon: '📻',
        category: 'audio',
        requirementType: 'broadcasts',
        requirementValue: 5,
        requirementMet: 2,
        color: 'orange',
        rarity: 'rare',
    },
    {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Use AudNova for 24+ hours continuously',
        icon: '🦉',
        category: 'network',
        requirementType: 'hours',
        requirementValue: 24,
        requirementMet: 8,
        color: 'indigo',
        rarity: 'epic',
    },
    {
        id: 'audio_quality',
        name: 'Crystal Clear',
        description: 'Maintain 99%+ audio quality for 1 hour',
        icon: '🎵',
        category: 'audio',
        requirementType: 'quality',
        requirementValue: 99,
        requirementMet: 97,
        color: 'cyan',
        rarity: 'rare',
    },
    {
        id: 'security_expert',
        name: 'Security Expert',
        description: 'Successfully verify 50+ peer identities',
        icon: '🔒',
        category: 'achievement',
        requirementType: 'connections',
        requirementValue: 50,
        requirementMet: 12,
        color: 'red',
        rarity: 'epic',
    },
    {
        id: 'legendary_user',
        name: 'Legendary User',
        description: 'Unlock all other badges',
        icon: '👑',
        category: 'achievement',
        requirementType: 'messages',
        requirementValue: 1,
        requirementMet: 0,
        color: 'gold',
        rarity: 'legendary',
    },
];

const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
        common: 'from-gray-400 to-gray-600',
        uncommon: 'from-green-400 to-green-600',
        rare: 'from-blue-400 to-blue-600',
        epic: 'from-purple-400 to-purple-600',
        legendary: 'from-yellow-400 to-yellow-600',
    };
    return colors[rarity] || colors.common;
};

const BadgeCard = ({ badge }: { badge: Badge }) => {
    const isUnlocked = badge.requirementMet >= badge.requirementValue;
    const progress = (badge.requirementMet / badge.requirementValue) * 100;

    return (
        <div className={`relative p-4 rounded-lg border-2 transition-all ${isUnlocked
                ? `border-yellow-400 bg-gradient-to-br ${getRarityColor(badge.rarity)}`
                : 'border-gray-300 bg-gray-100'
            }`}>
            {/* Unlock Status Badge */}
            <div className="absolute top-2 right-2">
                {isUnlocked ? (
                    <CheckCircle className="w-6 h-6 text-white drop-shadow-lg" />
                ) : (
                    <Lock className="w-6 h-6 text-gray-500" />
                )}
            </div>

            {/* Badge Icon */}
            <div className={`text-4xl mb-3 ${isUnlocked ? '' : 'opacity-50'}`}>
                {badge.icon}
            </div>

            {/* Badge Info */}
            <h3 className={`font-bold text-lg mb-1 ${isUnlocked ? 'text-white' : 'text-gray-800'}`}>
                {badge.name}
            </h3>

            <p className={`text-sm mb-3 ${isUnlocked ? 'text-white/90' : 'text-gray-700'}`}>
                {badge.description}
            </p>

            {/* Rarity Badge */}
            <div className="mb-3">
                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${isUnlocked
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-300 text-gray-700'
                    }`}>
                    {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
                </span>
            </div>

            {/* Requirement Progress */}
            <div className="mb-2">
                <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-semibold ${isUnlocked ? 'text-white' : 'text-gray-700'}`}>
                        {badge.requirementMet} / {badge.requirementValue}
                    </span>
                    <span className={`text-xs ${isUnlocked ? 'text-white/80' : 'text-gray-600'}`}>
                        {badge.requirementType.toUpperCase()}
                    </span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${isUnlocked ? 'bg-white/20' : 'bg-gray-300'
                    }`}>
                    <div
                        className={`h-full transition-all duration-300 ${isUnlocked
                                ? 'bg-white'
                                : 'bg-gradient-to-r from-blue-400 to-green-400'
                            }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>
            </div>

            {/* Unlock Date */}
            {badge.unlockedAt && (
                <p className={`text-xs mt-2 ${isUnlocked ? 'text-white/70' : 'text-gray-600'}`}>
                    🎉 Unlocked {badge.unlockedAt.toLocaleDateString()}
                </p>
            )}
        </div>
    );
};

export default function BadgeCheckPage() {
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterRarity, setFilterRarity] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const categories = ['all', 'achievement', 'social', 'audio', 'network'];
    const rarities = ['all', 'common', 'uncommon', 'rare', 'epic', 'legendary'];

    const filteredBadges = MOCK_BADGES.filter(badge => {
        const matchCategory = filterCategory === 'all' || badge.category === filterCategory;
        const matchRarity = filterRarity === 'all' || badge.rarity === filterRarity;
        const matchSearch = badge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            badge.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchCategory && matchRarity && matchSearch;
    });

    const unlockedCount = MOCK_BADGES.filter(b => b.requirementMet >= b.requirementValue).length;
    const totalCount = MOCK_BADGES.length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
            {/* Header */}
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <Trophy className="w-8 h-8 text-yellow-400" />
                        <h1 className="text-4xl font-bold text-white">Badge Collection</h1>
                    </div>
                    <p className="text-gray-300">
                        Unlock achievements and collect badges as you explore AudNova
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg p-4 text-white">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-5 h-5" />
                            <span className="text-sm font-semibold">UNLOCKED</span>
                        </div>
                        <div className="text-3xl font-bold">{unlockedCount}</div>
                        <p className="text-sm text-green-100">of {totalCount} badges</p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg p-4 text-white">
                        <div className="flex items-center gap-2 mb-2">
                            <Target className="w-5 h-5" />
                            <span className="text-sm font-semibold">PROGRESS</span>
                        </div>
                        <div className="text-3xl font-bold">{Math.round((unlockedCount / totalCount) * 100)}%</div>
                        <p className="text-sm text-blue-100">Overall completion</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg p-4 text-white">
                        <div className="flex items-center gap-2 mb-2">
                            <Star className="w-5 h-5" />
                            <span className="text-sm font-semibold">RAREST</span>
                        </div>
                        <div className="text-3xl font-bold">
                            {MOCK_BADGES.filter(b => b.rarity === 'legendary').length}
                        </div>
                        <p className="text-sm text-purple-100">Legendary badges</p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-lg p-4 text-white">
                        <div className="flex items-center gap-2 mb-2">
                            <Award className="w-5 h-5" />
                            <span className="text-sm font-semibold">STREAK</span>
                        </div>
                        <div className="text-3xl font-bold">7</div>
                        <p className="text-sm text-orange-100">Days active</p>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-slate-800 rounded-lg p-6 mb-8">
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Search badges..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Category
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setFilterCategory(cat)}
                                        className={`px-3 py-1 rounded-full text-sm font-semibold transition-all ${filterCategory === cat
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                                            }`}
                                    >
                                        {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Rarity
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {rarities.map(rarity => (
                                    <button
                                        key={rarity}
                                        onClick={() => setFilterRarity(rarity)}
                                        className={`px-3 py-1 rounded-full text-sm font-semibold transition-all ${filterRarity === rarity
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                                            }`}
                                    >
                                        {rarity === 'all' ? 'All' : rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Badges Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBadges.length > 0 ? (
                        filteredBadges.map(badge => (
                            <BadgeCard key={badge.id} badge={badge} />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12">
                            <p className="text-gray-400 text-lg">No badges found matching your filters</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
