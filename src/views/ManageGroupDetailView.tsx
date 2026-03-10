// @ts-nocheck
import React, { useState } from 'react';
import { motion, Reorder, useDragControls } from 'motion/react';
import useExchangeStore from '../stores/useExchangeStore';
import { LuChevronLeft, LuPlus, LuMenu, LuTrash2 } from 'react-icons/lu';
import { MdOutlineCheckBoxOutlineBlank, MdOutlineCheckBox } from 'react-icons/md';

const CoinReorderRow = ({ symbol, checked, onToggleCheck }) => {
    const controls = useDragControls();

    return (
        <Reorder.Item value={symbol} dragListener={false} dragControls={controls} className="flex justify-between items-center bg-white py-4 relative z-10 border-b border-slate-50">
            <div className="flex items-center gap-4">
                <div onClick={() => onToggleCheck(symbol)} className="cursor-pointer text-slate-300 hover:text-slate-400 transition-colors">
                    {checked ? (
                        <MdOutlineCheckBox size={22} className="text-slate-900" />
                    ) : (
                        <MdOutlineCheckBoxOutlineBlank size={22} />
                    )}
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-[16px] font-bold text-slate-900">{symbol.replace('USDT', '')}</span>
                    <span className="text-[13px] font-medium text-slate-400">/ USDT</span>
                    {symbol.includes('USDT') && <span className="text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 ml-1">10x</span>}
                </div>
            </div>
            <div className="flex items-center">
                <div
                    className="p-2 -mr-2 cursor-grab touch-none"
                    onPointerDown={(e) => controls.start(e)}
                >
                    <LuMenu size={20} className="text-slate-900" />
                </div>
            </div>
        </Reorder.Item>
    );
};

interface ManageGroupDetailViewProps {
    groupName: string;
    onClose: () => void;
}

const ManageGroupDetailView: React.FC<ManageGroupDetailViewProps> = ({ groupName, onClose }) => {
    const { favoriteGroups, reorderGroupCoins, removeCoinsFromGroup, setSearchOpen } = useExchangeStore();
    const [checkedCoins, setCheckedCoins] = useState<string[]>([]);

    const coins = favoriteGroups[groupName] || [];
    const isAllChecked = coins.length > 0 && checkedCoins.length === coins.length;

    const handleToggleCheck = (symbol: string) => {
        setCheckedCoins(prev =>
            prev.includes(symbol) ? prev.filter(c => c !== symbol) : [...prev, symbol]
        );
    };

    const handleToggleSelectAll = () => {
        if (isAllChecked) {
            setCheckedCoins([]);
        } else {
            setCheckedCoins([...coins]);
        }
    };

    const handleReorder = (newOrder: string[]) => {
        reorderGroupCoins(groupName, newOrder);
    };

    const handleRemove = () => {
        if (checkedCoins.length === 0) return;
        if (window.confirm(`Remove ${checkedCoins.length} coin(s) from ${groupName}?`)) {
            removeCoinsFromGroup(groupName, checkedCoins);
            setCheckedCoins([]);
        }
    };

    const handleAddCrypto = () => {
        // Just generic placeholder for now, usually opens SearchOverlay 
        setSearchOpen(true);
    };

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-[310] flex flex-col pt-[var(--safe-area-top)]"
        >
            <div className="flex justify-between items-center px-4 py-4 w-full">
                <LuChevronLeft size={24} className="text-slate-900 cursor-pointer" onClick={onClose} />
                <h2 className="text-[18px] font-bold text-slate-900 absolute left-1/2 -translate-x-1/2">{groupName}</h2>
                <LuPlus size={24} className="text-slate-900 cursor-pointer" onClick={handleAddCrypto} />
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-24 flex flex-col">
                {coins.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center -mt-20">
                        <h3 className="text-[18px] font-bold text-slate-900 mb-2">This group is empty</h3>
                        <p className="text-[14px] text-slate-500 mb-6">Start building it by adding crypto.</p>
                        <button
                            onClick={handleAddCrypto}
                            className="bg-slate-100 text-slate-900 px-5 py-2.5 rounded-full font-bold text-[14px] flex items-center gap-2"
                        >
                            <LuPlus size={18} /> Add crypto
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="px-4 py-4 flex justify-between items-center border-b border-slate-50">
                            <div className="flex items-center gap-4 cursor-pointer" onClick={handleToggleSelectAll}>
                                {isAllChecked ? (
                                    <MdOutlineCheckBox size={22} className="text-slate-900" />
                                ) : (
                                    <MdOutlineCheckBoxOutlineBlank size={22} className="text-slate-300" />
                                )}
                                <span className="text-[16px] font-bold text-slate-900">Select all</span>
                            </div>
                            <span className="text-[13px] text-slate-400 font-medium">Sort</span>
                        </div>

                        <div className="px-4 pb-4">
                            <Reorder.Group axis="y" values={coins} onReorder={handleReorder} className="space-y-0 relative z-10 w-full">
                                {coins.map(symbol => (
                                    <CoinReorderRow
                                        key={symbol}
                                        symbol={symbol}
                                        checked={checkedCoins.includes(symbol)}
                                        onToggleCheck={handleToggleCheck}
                                    />
                                ))}
                            </Reorder.Group>
                        </div>
                    </>
                )}
            </div>

            {/* Bottom Actions */}
            {coins.length > 0 && (
                <div className="absolute bottom-0 left-0 w-full p-4 bg-white flex justify-between" style={{ paddingBottom: 'calc(16px + var(--safe-area-bottom))' }}>
                    <div className="flex items-center gap-2 opacity-30 cursor-not-allowed">
                        <LuPlus size={20} className="text-slate-400" />
                        <span className="text-[16px] font-medium text-slate-400">Add to</span>
                    </div>
                    <div
                        className={`flex items-center gap-2 ${checkedCoins.length > 0 ? 'cursor-pointer' : 'opacity-30 cursor-not-allowed'}`}
                        onClick={handleRemove}
                    >
                        <LuTrash2 size={20} className={checkedCoins.length > 0 ? 'text-slate-900' : 'text-slate-400'} />
                        <span className={`text-[16px] font-medium ${checkedCoins.length > 0 ? 'text-slate-900' : 'text-slate-400'}`}>Remove</span>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default ManageGroupDetailView;
