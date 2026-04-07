/**
 * CreateRadioPage - Improved Radio Creation with Real Services
 * Now uses RadioService to create actual channels
 */

import React, { useState } from 'react';
import { ChevronLeft, RadioIcon, Save } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useRadioService } from '../context/AudNovaContext';
import { useAudNova } from '../context/AudNovaContext';
import { Radio } from '../types';
import { CATEGORIES } from '../constants';

interface CreateRadioPageProps {
    onBack: () => void;
    onCreate: (radio: Radio) => void;
}

/**
 * CreateRadioPage - Create channels with real RadioService
 */
export function CreateRadioPage({ onBack, onCreate }: CreateRadioPageProps) {
    const { userId, isInitialized } = useAudNova();
    const radioService = useRadioService();

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0] || 'general');
    const [logo, setLogo] = useState('');
    const [status, setStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const handleCreate = async () => {
        if (!name.trim()) {
            setErrorMsg('Por favor, insira o nome da rádio.');
            return;
        }

        if (!isInitialized || !radioService || !userId) {
            setErrorMsg('AudNova não inicializado. Aguarde...');
            return;
        }

        try {
            setStatus('creating');
            setErrorMsg('');

            // Create channel using RadioService
            const channel = radioService.createChannel({
                name: name.trim(),
                description: description.trim(),
                category,
                creatorId: userId,
            });

            // Build radio object for existing App.tsx interface
            const newRadio: Radio = {
                id: channel.id,
                name: channel.name,
                host: userId,
                listeners: 0,
                status: 'live',
                category: channel.category,
                signal: 100,
                image: logo || `https://picsum.photos/seed/${name.trim()}/400/400`,
            };

            setStatus('success');
            onCreate(newRadio);

            // Reset form
            setName('');
            setDescription('');
            setCategory(CATEGORIES[0] || 'general');
            setLogo('');

            // Callback to close page after short delay
            setTimeout(() => {
                onBack();
            }, 1000);
        } catch (error) {
            setStatus('error');
            setErrorMsg(error instanceof Error ? error.message : 'Erro ao criar rádio');
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden gap-4">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-10 h-10 p-0 rounded-xl"
                        onClick={onBack}
                    >
                        <ChevronLeft size={20} />
                    </Button>
                    <div className="flex flex-col">
                        <h2 className="text-lg font-black text-white uppercase italic tracking-tighter leading-none">
                            Criar Nova Rádio
                        </h2>
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mt-1">
                            Inicie sua Transmissão
                        </span>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
                {/* Status Message */}
                {errorMsg && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                        <p className="text-sm text-red-400">{errorMsg}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                        <p className="text-sm text-green-400">✅ Rádio criada com sucesso!</p>
                    </div>
                )}

                {/* Name */}
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        Nome da Rádio
                    </label>
                    <input
                        type="text"
                        placeholder="Ex: CyberRunner FM"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={status === 'creating'}
                        className="h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-white/20 focus:border-cyan-400/50 outline-none disabled:opacity-50"
                    />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        Descrição
                    </label>
                    <textarea
                        placeholder="O que sua rádio transmite?"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={status === 'creating'}
                        className="h-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-cyan-400/50 outline-none resize-none disabled:opacity-50"
                    />
                </div>

                {/* Category */}
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        Categoria
                    </label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        disabled={status === 'creating'}
                        className="h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-cyan-400/50 outline-none disabled:opacity-50"
                    >
                        {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Logo URL */}
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        Logo (URL)
                    </label>
                    <input
                        type="text"
                        placeholder="https://..."
                        value={logo}
                        onChange={(e) => setLogo(e.target.value)}
                        disabled={status === 'creating'}
                        className="h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-white/20 focus:border-cyan-400/50 outline-none disabled:opacity-50"
                    />
                    {logo && (
                        <img
                            src={logo}
                            alt="Preview"
                            className="h-24 rounded-lg object-cover border border-white/10"
                        />
                    )}
                </div>

                {/* Info Card */}
                <Card className="p-4" variant="default">
                    <p className="text-xs text-white/60">
                        💡 Sua rádio será criada como um canal no AudNova com suporte a:
                    </p>
                    <ul className="text-xs text-white/40 mt-2 space-y-1">
                        <li>✓ Transmissão P2P em mesh</li>
                        <li>✓ Chat criptografado E2EE</li>
                        <li>✓ Múltiplos ouvintes simultâneos</li>
                        <li>✓ Sistema de reações e hypers</li>
                    </ul>
                </Card>
            </div>

            {/* Footer */}
            <div className="flex gap-3 shrink-0">
                <Button
                    variant="ghost"
                    onClick={onBack}
                    disabled={status === 'creating'}
                    className="flex-1"
                >
                    Cancelar
                </Button>
                <Button
                    variant="primary"
                    onClick={handleCreate}
                    disabled={!name.trim() || !isInitialized || status === 'creating'}
                    className="flex-1 gap-2 bg-cyan-500 text-black"
                >
                    <RadioIcon size={16} />
                    {status === 'creating' ? 'Criando...' : 'Criar Rádio'}
                </Button>
            </div>
        </div>
    );
}

export default CreateRadioPage;
