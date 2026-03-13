import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiX as Close,
    FiDownload as Download,
    FiCopy as Copy,
    FiMessageSquare as Messages,
    FiChevronLeft as ChevronLeft,
    FiExternalLink as ExternalLink,
    FiSend as Send
} from 'react-icons/fi';
import { FaWhatsapp as Whatsapp, FaTelegramPlane as Telegram } from 'react-icons/fa';
import useExchangeStore from '../stores/useExchangeStore';
import trivLogo from '../assets/triv-logo.svg';
import shareBg1 from '../assets/share-1.jpg';
import shareBg2 from '../assets/share-2.jpg';

const SHARE_IMAGES = [
    shareBg1,
    shareBg2
];

const SharePnLSheet = () => {
    const {
        isSharePnLSheetOpen,
        setSharePnLSheetOpen,
        activeShareData,
        wallets,
        showToast
    } = useExchangeStore();

    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        if (isSharePnLSheetOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isSharePnLSheetOpen]);

    const maskedEmail = "triv***@gmail.com";
    const timestamp = useMemo(() => {
        const d = new Date();
        return {
            time: `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')} (UTC+7)`,
            date: `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
        };
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText('triv.co.id/ref/TRV123');
        showToast('Link Copied', 'Referral link copied to clipboard', 'success');
    };

    if (!activeShareData) return null;

    const { symbol, side, isFutures, leverage, entryPrice, lastPrice, pnlPercent } = activeShareData;

    return (
        <AnimatePresence>
            {isSharePnLSheetOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 z-[2000] backdrop-blur-[2px]"
                        onClick={() => setSharePnLSheetOpen(false)}
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-[var(--bg-primary)] rounded-t-[24px] z-[2001] flex flex-col max-h-[98vh] overflow-hidden shadow-2xl"
                        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
                    >
                        {/* Handle */}
                        <div className="flex justify-center mt-2.5 mb-1 shrink-0">
                            <div className="w-10 h-1 bg-[var(--border-color)] rounded-full opacity-40" />
                        </div>
                        {/* Custom Nav Header */}
                        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)] bg-[var(--bg-primary)] sticky top-0 z-50">
                            <button onClick={() => setSharePnLSheetOpen(false)} className="p-1.5 hover:bg-[var(--bg-hover)] rounded-full transition-colors text-[var(--text-primary)]">
                                <ChevronLeft size={24} />
                            </button>
                            <h1 className="text-[17px] font-bold text-[var(--text-primary)]">My trades</h1>
                            <button className="p-1.5 hover:bg-[var(--bg-hover)] rounded-full transition-colors text-[var(--text-primary)]">
                                <Download size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto pb-4 no-scrollbar">
                            <div className="px-5 pt-4 pb-2">
                                {/* Title Section */}
                                <div className="flex items-center justify-between mb-4 px-1">
                                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Share this page</h2>
                                    <button className="p-1.5 hover:bg-[var(--bg-hover)] rounded-full transition-colors text-[var(--text-primary)]">
                                        <ExternalLink size={20} />
                                    </button>
                                </div>

                                {/* Main Card */}
                                <div className="bg-black rounded-xl overflow-hidden shadow-2xl relative w-full aspect-[4/5] flex flex-col mb-3 ring-1 ring-white/10">
                                    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]">
                                        <img
                                            src={SHARE_IMAGES[selectedIndex]}
                                            alt="Background"
                                            className="w-full h-full object-cover opacity-60 transition-opacity duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black/90" />
                                    </div>

                                    <div className="relative z-10 flex flex-col h-full p-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-gray-600 overflow-hidden ring-1 ring-white/20">
                                                    <img
                                                        src="https://i.pravatar.cc/100?img=12"
                                                        alt="User"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <span className="text-white text-[11px] font-medium">{maskedEmail}</span>
                                            </div>
                                            <div className="text-right text-[9px] text-gray-400 leading-tight">
                                                <p>{timestamp.time}</p>
                                                <p>{timestamp.date}</p>
                                            </div>
                                        </div>

                                        <div className="flex-1" />

                                        <div className="mb-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <img src={trivLogo} alt="TRIV" className="h-9" />
                                            </div>
                                            <p className={`text-4xl font-semibold tracking-tighter ${pnlPercent >= 0 ? 'text-[#00c076]' : 'text-[#ff4d5b]'}`}>
                                                {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
                                                <img
                                                    src={`https://cdn.jsdelivr.net/gh/vadimmalykhin/binance-icons/crypto/${symbol.replace('1000', '').replace('USDT', '').toLowerCase()}.svg`}
                                                    onError={(e) => {
                                                        const clean = symbol.replace('1000', '').replace('USDT', '').toLowerCase();
                                                        const fallbacks = [
                                                            `https://static.okx.com/cdn/oksupport/asset/currency/icon/${clean}.png`,
                                                            `https://assets.coincap.io/assets/icons/${clean}@2x.png`,
                                                            `https://cryptologos.cc/logos/${clean}-${clean}-logo.png`
                                                        ];
                                                        const currentIdx = e.currentTarget.dataset.fallbackIdx ? parseInt(e.currentTarget.dataset.fallbackIdx) : 0;
                                                        if (currentIdx < fallbacks.length) {
                                                            e.currentTarget.dataset.fallbackIdx = (currentIdx + 1).toString();
                                                            e.currentTarget.src = fallbacks[currentIdx];
                                                        } else {
                                                            e.target.style.display = 'none';
                                                        }
                                                    }}
                                                    alt={symbol}
                                                    className="w-full h-full object-contain scale-110"
                                                />
                                            </div>
                                            <div>
                                                <h3 className="text-white font-bold text-[13px]">{symbol}{isFutures ? ' Perp' : '/USDT'}</h3>
                                                <div className="flex items-center gap-1.5 text-[9px] font-medium mt-0.5">
                                                    <span className={side === 'Buy' ? 'text-green-500' : 'text-red-500'}>{side === 'Buy' ? 'Long' : 'Short'}</span>
                                                    <span className="text-gray-600">|</span>
                                                    <span className="text-gray-400">{isFutures ? `${leverage}x` : 'Spot'}</span>
                                                    <span className="text-gray-600">|</span>
                                                    <span className="text-gray-400">Open</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pb-3 border-b border-white/10">
                                            <div>
                                                <p className="text-gray-500 text-[10px] mb-0.5">Entry price</p>
                                                <p className="text-white font-medium text-[13px]">{entryPrice.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-[10px] mb-0.5">Last price</p>
                                                <p className="text-white font-medium text-[13px]">{lastPrice.toLocaleString()}</p>
                                            </div>
                                        </div>

                                        <div className="pt-3 flex items-center justify-between">
                                            <div>
                                                <p className="text-gray-400 text-[9px] mb-0.5 italic">Join TRIV with my referral link</p>
                                                <p className="text-white font-bold text-[12px]">triv.co.id/ref/TRV123</p>
                                            </div>
                                            <div className="bg-white p-0.5 rounded-sm w-10 h-10 shadow-inner">
                                                <img
                                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://triv.co.id/ref/TRV123&bgcolor=ffffff&color=000000`}
                                                    alt="QR Code"
                                                    className="w-full h-full"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Indicators */}
                                <div className="flex justify-center gap-1.5 mb-4">
                                    {SHARE_IMAGES.slice(0, 3).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-1 rounded-full transition-all duration-300 ${selectedIndex % 3 === i ? 'w-3 bg-black' : 'w-1 bg-gray-300'}`}
                                        />
                                    ))}
                                </div>

                                {/* Image Selector Thumbnails */}
                                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-3 px-1">
                                    {SHARE_IMAGES.map((src, i) => (
                                        <div
                                            key={i}
                                            onClick={() => setSelectedIndex(i)}
                                            className={`w-[56px] h-[56px] aspect-square rounded-[4px] overflow-hidden flex-none border-2 cursor-pointer transition-all ${i === selectedIndex ? 'border-black scale-105 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                        >
                                            <img src={src} className="w-full h-full object-cover" alt={`Thumb ${i}`} />
                                        </div>
                                    ))}
                                </div>

                                <p className="text-[11px] text-gray-500 leading-tight mb-5 px-1">
                                    Each friend signs up and trades 50 USDT, you'll get up to <span className="text-green-600 font-bold">10 USDT</span>.
                                </p>

                                {/* Bottom Buttons */}
                                <div className="flex justify-between items-center px-1">
                                    <div className="flex flex-col items-center gap-1.5">
                                        <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-md shadow-[#25D366]/10">
                                            <span className="text-white"><Whatsapp size={24} /></span>
                                        </div>
                                        <span className="text-[10px] text-gray-700 font-medium">WhatsApp</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1.5">
                                        <div className="w-12 h-12 rounded-full bg-[#0088cc] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-md shadow-[#0088cc]/10">
                                            <span className="text-white -ml-0.5"><Send size={20} /></span>
                                        </div>
                                        <span className="text-[10px] text-gray-700 font-medium">Telegram</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1.5">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
                                            <span className="text-gray-700"><Messages size={20} /></span>
                                        </div>
                                        <span className="text-[10px] text-gray-700 font-medium">Messages</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1.5" onClick={() => showToast('Saved', 'Saved to gallery', 'success')}>
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
                                            <span className="text-gray-700"><Download size={20} /></span>
                                        </div>
                                        <span className="text-[10px] text-gray-700 font-medium">Save</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1.5" onClick={handleCopy}>
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
                                            <span className="text-gray-700"><Copy size={20} /></span>
                                        </div>
                                        <span className="text-[10px] text-gray-700 font-medium">Copy</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default SharePnLSheet;
