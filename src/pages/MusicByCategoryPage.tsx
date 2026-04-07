/**
 * AudNova - Music by Category Page
 * Browse radios and music tracks organized by genre/category
 */

import React, { useState, useMemo } from 'react';
import { ChevronLeft, Radio as RadioIcon, Music, Play, Heart, Users, Zap, Search } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Radio } from '../types';
import { MOCK_RADIOS, CATEGORIES_LIST } from '../constants';
import { cn } from '../lib/utils';

interface MusicTrack {
    id: string;
    title: string;
    artist: string;
    duration: number;
    category: string;
    plays: number;
    isFavorite?: boolean;
}

interface MusicCategory {
    id: string;
    name: string;
    icon: string;
    color: string;
    description: string;
    radios: Radio[];
    tracks: MusicTrack[];
}

const MOCK_TRACKS: MusicTrack[] = [
    {
        id: 'track-1',
        title: 'Neon Dreams',
        artist: 'Synthesizer Wave',
        duration: 243,
        category: 'eletrônico',
        plays: 1240,
    },
    {
        id: 'track-2',
        title: 'Midnight Echo',
        artist: 'Digital Souls',
        duration: 287,
        category: 'eletrônico',
        plays: 856,
    },
    {
        id: 'track-3',
        title: 'Urban Beats',
        artist: 'City Vibes',
        duration: 198,
        category: 'hip-hop',
        plays: 2103,
    },
    {
        id: 'track-4',
        title: 'Jazz Night',
        artist: 'Blue Notes Ensemble',
        duration: 312,
        category: 'jazz',
        plays: 645,
    },
    {
        id: 'track-5',
        title: 'Summer Breeze',
        artist: 'Tropical Vibes',
        duration: 267,
        category: 'pop',
        plays: 3421,
    },
    {
        id: 'track-6',
        title: 'Rock Anthem',
        artist: 'Electric Thunder',
        duration: 245,
        category: 'rock',
        plays: 1876,
    },
];

// Build categories dynamically from CATEGORIES_LIST with radio/track data
const buildCategories = (): MusicCategory[] => {
    const categories: MusicCategory[] = [];

    // Filter only browsable categories
    const browsableCategories = CATEGORIES_LIST.filter(cat => cat.isBrowsable);

    browsableCategories.forEach(catMeta => {
        const categoryRadios = MOCK_RADIOS.filter(r =>
            r.category.toLowerCase() === catMeta.name.toLowerCase()
        );

        const category: MusicCategory = {
            id: catMeta.id,
            name: catMeta.name,
            icon: catMeta.icon,
            color: catMeta.color,
            description: `Explore ${catMeta.name.toLowerCase()} com ${categoryRadios.length} estações`,
            radios: categoryRadios,
            tracks: MOCK_TRACKS.filter(t => t.category === catMeta.id),
        };
        categories.push(category);
    });

    // Sort by featured (100+) first, then by radio count descending
    const featuredFirst = categories.sort((a, b) => {
        const aIsFeatured = a.radios.length >= 100;
        const bIsFeatured = b.radios.length >= 100;

        if (aIsFeatured !== bIsFeatured) {
            return aIsFeatured ? -1 : 1;
        }
        return b.radios.length - a.radios.length;
    });

    return featuredFirst;
};

const MUSIC_CATEGORIES: MusicCategory[] = buildCategories();

interface MusicByCategoryPageProps {
    onBack: () => void;
    onSelectRadio?: (radio: Radio) => void;
    onPlayTrack?: (track: MusicTrack) => void;
}

const TrackCard = ({ track, onPlay }: { track: MusicTrack; onPlay?: (track: MusicTrack) => void }) => {
    const minutes = Math.floor(track.duration / 60);
    const seconds = track.duration % 60;

    return (
        <Card className="p-3 flex items-center gap-3 hover:bg-white/10 transition-all group cursor-pointer" variant="default">
            <button
                onClick={() => onPlay?.(track)}
                className="w-10 h-10 rounded-lg bg-neon-cyan/20 flex items-center justify-center text-neon-cyan group-hover:bg-neon-cyan group-hover:text-black transition-all shrink-0"
            >
                <Play size={16} fill="currentColor" />
            </button>

            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white truncate">{track.title}</h4>
                <p className="text-xs text-white/60 truncate">{track.artist}</p>
            </div>

            <div className="flex items-center gap-2 text-xs text-white/40 shrink-0">
                <span>{minutes}:{String(seconds).padStart(2, '0')}</span>
                <span className="text-[9px]">•</span>
                <span>{track.plays.toLocaleString()} plays</span>
            </div>
        </Card>
    );
};

const RadioCard = ({ radio, onSelect }: { radio: Radio; onSelect?: (radio: Radio) => void }) => {
    return (
        <Card
            className="p-3 flex items-center gap-3 hover:bg-white/10 transition-all group cursor-pointer"
            variant="default"
            onClick={() => onSelect?.(radio)}
        >
            <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                <img src={radio.image} alt={radio.name} className="w-full h-full object-cover" />
                {radio.status === 'live' && (
                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white truncate">{radio.name}</h4>
                <div className="flex items-center gap-2 text-xs text-white/60">
                    <span>{radio.host}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                        <Users size={12} />
                        {radio.listeners}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
                <span className={cn(
                    'text-[8px] font-bold px-2 py-1 rounded',
                    radio.status === 'live'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-white/10 text-white/40'
                )}>
                    {radio.status === 'live' ? 'AO VIVO' : 'OFFLINE'}
                </span>
            </div>
        </Card>
    );
};

const CategorySection = ({
    category,
    isExpanded,
    onToggle,
    onSelectRadio,
    onPlayTrack,
}: {
    category: MusicCategory;
    isExpanded: boolean;
    onToggle: () => void;
    onSelectRadio?: (radio: Radio) => void;
    onPlayTrack?: (track: MusicTrack) => void;
}) => {
    const hasContent = category.radios.length > 0 || category.tracks.length > 0;

    return (
        <div className="flex flex-col gap-3">
            <button
                onClick={onToggle}
                className="flex items-center gap-3 p-4 rounded-lg hover:bg-white/5 transition-all"
            >
                <div className={cn(
                    'w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-gradient-to-br',
                    category.color
                )}>
                    {category.icon}
                </div>

                <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white">{category.name}</h3>
                        {category.radios.length >= 100 && (
                            <span className="text-[9px] font-bold px-2 py-1 rounded bg-neon-cyan/20 text-neon-cyan uppercase tracking-widest">
                                🔥 Featured
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-white/60">{category.description}</p>
                </div>

                <div className="text-white/40">
                    <span className="text-xs font-bold">{category.radios.length + category.tracks.length}</span>
                </div>
            </button>

            {isExpanded && hasContent && (
                <div className="pl-4 pr-2 flex flex-col gap-3">
                    {/* Radios */}
                    {category.radios.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <h4 className="text-xs font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
                                <RadioIcon size={12} />
                                Rádios ({category.radios.length})
                            </h4>
                            <div className="flex flex-col gap-2">
                                {category.radios.slice(0, 3).map(radio => (
                                    <RadioCard key={radio.id} radio={radio} onSelect={onSelectRadio} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tracks */}
                    {category.tracks.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <h4 className="text-xs font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
                                <Music size={12} />
                                Faixas Populares ({category.tracks.length})
                            </h4>
                            <div className="flex flex-col gap-2">
                                {category.tracks.slice(0, 3).map(track => (
                                    <TrackCard key={track.id} track={track} onPlay={onPlayTrack} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default function MusicByCategoryPage({
    onBack,
    onSelectRadio,
    onPlayTrack,
}: MusicByCategoryPageProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set(MUSIC_CATEGORIES.map(c => c.id))
    );

    const filteredCategories = useMemo(() => {
        if (!searchTerm) return MUSIC_CATEGORIES;

        return MUSIC_CATEGORIES.filter(category =>
            category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            category.radios.some(r =>
                r.name.toLowerCase().includes(searchTerm.toLowerCase())
            ) ||
            category.tracks.some(t =>
                t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.artist.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [searchTerm]);

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(categoryId)) {
                next.delete(categoryId);
            } else {
                next.add(categoryId);
            }
            return next;
        });
    };

    const totalContent = MUSIC_CATEGORIES.reduce((sum, cat) => sum + cat.radios.length + cat.tracks.length, 0);

    return (
        <div className="flex flex-col h-full overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <div className="flex items-center gap-3 p-6 shrink-0 border-b border-white/5">
                <button
                    onClick={onBack}
                    className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                >
                    <ChevronLeft size={20} className="text-white" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white uppercase tracking-tight">Música por Categoria</h1>
                    <p className="text-xs text-white/60">{totalContent} rádios e faixas disponíveis</p>
                </div>
            </div>

            {/* Search */}
            <div className="p-4 shrink-0 border-b border-white/5">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                        type="text"
                        placeholder="Procurar categoria, rádio ou faixa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan focus:bg-white/10 transition-all"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
                <div className="p-4 flex flex-col gap-4">
                    {filteredCategories.length > 0 ? (
                        filteredCategories.map(category => (
                            <CategorySection
                                key={category.id}
                                category={category}
                                isExpanded={expandedCategories.has(category.id)}
                                onToggle={() => toggleCategory(category.id)}
                                onSelectRadio={onSelectRadio}
                                onPlayTrack={onPlayTrack}
                            />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Music size={32} className="text-white/20 mb-3" />
                            <p className="text-white/60">Nenhuma categoria encontrada</p>
                            <button
                                onClick={() => setSearchTerm('')}
                                className="text-neon-cyan text-sm mt-2 hover:underline"
                            >
                                Limpar busca
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
