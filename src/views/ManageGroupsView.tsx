// @ts-nocheck
import React, { useState } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'motion/react';
import useExchangeStore from '../stores/useExchangeStore';
import { LuChevronLeft, LuPlus, LuEye, LuEyeOff, LuMenu, LuTrash2, LuPencil, LuChevronRight } from 'react-icons/lu';
import { MdOutlineMoreHoriz } from 'react-icons/md';
import ManageGroupDetailView from './ManageGroupDetailView';

const ReorderableRow = ({ opt, isDefault, onToggleVisibility, onEditClick, onRowClick }) => {
    const controls = useDragControls();

    return (
        <Reorder.Item value={opt} dragListener={false} dragControls={controls} className="flex justify-between items-center bg-white py-3 relative z-10 w-full" style={{ touchAction: 'none' }}>
            <div
                className={`flex-1 flex items-center h-full ${!isDefault ? 'cursor-pointer' : ''}`}
                onClick={() => !isDefault && onRowClick(opt)}
            >
                <span className="text-[16px] font-medium text-slate-900">{opt}</span>
            </div>
            <div className="flex items-center gap-6 justify-end w-32">
                {!isDefault ? (
                    <MdOutlineMoreHoriz size={20} className="text-slate-900 cursor-pointer" onClick={() => onEditClick(opt)} />
                ) : (
                    <div className="w-[20px]" />
                )}
                <LuEye size={20} className="text-slate-900 cursor-pointer" onClick={() => onToggleVisibility(opt)} />
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

const ManageGroupsView = () => {
    const { setManageGroupsOpen, favoriteGroups, hiddenGroups, toggleGroupVisibility, addFavoriteGroup, deleteFavoriteGroup, renameFavoriteGroup, reorderFavoriteGroups } = useExchangeStore();
    const [editSheetGroup, setEditSheetGroup] = useState<string | null>(null);
    const [detailGroup, setDetailGroup] = useState<string | null>(null);
    const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [isEditNameOpen, setIsEditNameOpen] = useState(false);
    const [editGroupName, setEditGroupName] = useState('');

    const defaultTabs = ['All', 'Futures', 'Spot'];
    const customGroups = Object.keys(favoriteGroups);
    const allGroups = [...defaultTabs, ...customGroups];

    const visibleGroups = allGroups.filter(g => !hiddenGroups.includes(g));
    const hiddenList = allGroups.filter(g => hiddenGroups.includes(g));

    const handleAddGroupSubmit = () => {
        if (newGroupName && newGroupName.trim()) {
            if (allGroups.includes(newGroupName.trim())) {
                alert("Group name already exists!");
                return;
            }
            addFavoriteGroup(newGroupName.trim());
            setIsAddGroupOpen(false);
            setNewGroupName('');
        }
    };

    const handleReorder = (newOrder: string[]) => {
        // extract custom groups from newOrder to update the store
        const newCustomOrder = newOrder.filter(g => customGroups.includes(g));
        reorderFavoriteGroups(newCustomOrder);
    };

    const handleRename = () => {
        if (!editSheetGroup) return;
        setEditGroupName(editSheetGroup);
        setIsEditNameOpen(true);
        // Do not setEditSheetGroup(null) yet so we know which group we're editing
    };

    const handleEditGroupSubmit = () => {
        if (editGroupName && editGroupName.trim() && editSheetGroup) {
            if (editGroupName.trim() !== editSheetGroup && allGroups.includes(editGroupName.trim())) {
                alert("Group name already exists!");
                return;
            }
            if (editGroupName.trim() !== editSheetGroup) {
                renameFavoriteGroup(editSheetGroup, editGroupName.trim());
            }
            setIsEditNameOpen(false);
            setEditSheetGroup(null);
            setEditGroupName('');
        }
    };

    const handleDelete = () => {
        if (!editSheetGroup) return;
        if (window.confirm(`Are you sure you want to delete group "${editSheetGroup}"?`)) {
            deleteFavoriteGroup(editSheetGroup);
        }
        setEditSheetGroup(null);
    };

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-[300] flex flex-col"
        >
            <div className="flex justify-between items-center px-4 py-4">
                <LuChevronLeft size={24} className="text-slate-900 cursor-pointer" onClick={() => window.history.back()} />
                <h2 className="text-[18px] font-bold text-slate-900">Manage groups</h2>
                <div className="w-[24px]" /> {/* Empty div to balance header instead of plus icon */}
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-32"> {/* Increased padding for bottom button */}
                <div className="px-4 py-4 flex justify-between text-xs font-medium text-slate-400">
                    <span>Name</span>
                    <div className="flex justify-end gap-5 w-32 pr-1">
                        <span>Edit</span>
                        <span>Hide</span>
                        <span>Sort</span>
                    </div>
                </div>

                <div className="px-4">
                    <Reorder.Group axis="y" values={visibleGroups} onReorder={handleReorder} className="space-y-0 relative z-10 w-full">
                        {visibleGroups.map(opt => (
                            <ReorderableRow
                                key={opt}
                                opt={opt}
                                isDefault={defaultTabs.includes(opt)}
                                onToggleVisibility={toggleGroupVisibility}
                                onEditClick={setEditSheetGroup}
                                onRowClick={setDetailGroup}
                            />
                        ))}
                    </Reorder.Group>
                </div>

                {hiddenList.length > 0 && (
                    <>
                        <div className="px-4 mt-8 mb-4">
                            <span className="text-xs font-medium text-slate-400">Hidden</span>
                        </div>

                        <div className="px-4 space-y-0 pb-8">
                            <AnimatePresence>
                                {hiddenList.map(opt => {
                                    const isDefault = defaultTabs.includes(opt);
                                    return (
                                        <motion.div layout key={opt} className="flex justify-between items-center py-3 opacity-50 bg-white relative z-0">
                                            <span className="text-[16px] font-medium text-slate-900">{opt}</span>
                                            <div className="flex items-center gap-6 justify-end w-32">
                                                <div className="w-[20px]" />
                                                <LuEyeOff size={20} className="text-slate-900 cursor-pointer" onClick={() => toggleGroupVisibility(opt)} />
                                                <LuMenu size={20} className="text-slate-900 cursor-not-allowed" />
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </>
                )}
            </div>

            {/* Bottom Button */}
            <div className="absolute bottom-0 left-0 w-full p-4 bg-white z-50 rounded-t-xl" style={{ paddingBottom: 'calc(16px + var(--safe-area-bottom))' }}>
                <button
                    onClick={() => {
                        setNewGroupName('');
                        setIsAddGroupOpen(true);
                    }}
                    className="w-full bg-[#111] text-white py-3.5 rounded-full font-bold text-[16px]"
                >
                    New group
                </button>
            </div>

            {/* Edit Bottom Sheet */}
            <AnimatePresence>
                {editSheetGroup && !isEditNameOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black z-[310]"
                            onClick={() => setEditSheetGroup(null)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[24px] z-[320] px-6 pt-2 pb-10 flex flex-col"
                            style={{ paddingBottom: 'calc(40px + var(--safe-area-bottom))' }}
                        >
                            <div className="flex justify-center mb-6">
                                <div className="w-10 h-1 bg-slate-200 rounded-full" />
                            </div>

                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-[20px] font-semibold text-slate-900">Edit group</h2>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-center py-2 cursor-pointer" onClick={handleRename}>
                                    <div className="flex items-center gap-3">
                                        <LuPencil size={20} className="text-slate-900" />
                                        <span className="text-[17px] text-slate-900 font-medium">Edit group name</span>
                                    </div>
                                    <LuChevronRight size={20} className="text-slate-400" />
                                </div>
                                <div className="flex justify-between items-center py-2 cursor-pointer" onClick={handleDelete}>
                                    <div className="flex items-center gap-3">
                                        <LuTrash2 size={20} className="text-slate-900" />
                                        <span className="text-[17px] text-slate-900 font-medium">Delete group</span>
                                    </div>
                                    <LuChevronRight size={20} className="text-slate-400" />
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Edit Name Bottom Sheet */}
            <AnimatePresence>
                {isEditNameOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black z-[310]"
                            onClick={() => {
                                setIsEditNameOpen(false);
                                setEditSheetGroup(null);
                            }}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[24px] z-[320] px-6 pt-2 pb-10 flex flex-col"
                            style={{ paddingBottom: 'calc(40px + var(--safe-area-bottom))' }}
                        >
                            <div className="flex justify-center mb-6">
                                <div className="w-10 h-1 bg-slate-200 rounded-full" />
                            </div>

                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-[20px] font-semibold text-slate-900">Edit group name</h2>
                            </div>

                            <div className="flex flex-col gap-4">
                                <input
                                    type="text"
                                    placeholder="Enter group name"
                                    value={editGroupName}
                                    onChange={(e) => setEditGroupName(e.target.value)}
                                    autoFocus
                                    className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-slate-900 transition-colors"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleEditGroupSubmit();
                                        }
                                    }}
                                />
                                <button
                                    onClick={handleEditGroupSubmit}
                                    disabled={!editGroupName.trim()}
                                    className="w-full bg-[#111] disabled:bg-slate-200 disabled:text-slate-400 text-white py-3.5 rounded-full font-bold text-[16px] transition-colors"
                                >
                                    Save
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Add Group Bottom Sheet */}
            <AnimatePresence>
                {isAddGroupOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black z-[310]"
                            onClick={() => setIsAddGroupOpen(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[24px] z-[320] px-6 pt-2 pb-10 flex flex-col"
                            style={{ paddingBottom: 'calc(40px + var(--safe-area-bottom))' }}
                        >
                            <div className="flex justify-center mb-6">
                                <div className="w-10 h-1 bg-slate-200 rounded-full" />
                            </div>

                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-[20px] font-semibold text-slate-900">New group</h2>
                            </div>

                            <div className="flex flex-col gap-4">
                                <input
                                    type="text"
                                    placeholder="Enter group name"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    autoFocus
                                    className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-slate-900 transition-colors"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleAddGroupSubmit();
                                        }
                                    }}
                                />
                                <button
                                    onClick={handleAddGroupSubmit}
                                    disabled={!newGroupName.trim()}
                                    className="w-full bg-[#111] disabled:bg-slate-200 disabled:text-slate-400 text-white py-3.5 rounded-full font-bold text-[16px] transition-colors"
                                >
                                    Create group
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Detail View Overlay */}
            <AnimatePresence>
                {detailGroup && (
                    <ManageGroupDetailView
                        groupName={detailGroup}
                        onClose={() => setDetailGroup(null)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ManageGroupsView;
