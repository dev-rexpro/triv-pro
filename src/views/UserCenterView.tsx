import React from 'react';
import { motion } from 'motion/react';
import useExchangeStore from '../stores/useExchangeStore';
import { IoChevronBack } from "react-icons/io5";
import { LuUserPlus } from "react-icons/lu";
import { IoIosArrowForward } from "react-icons/io";
import { MdOutlineContentCopy } from "react-icons/md";

const UserCenterView = () => {
    const { setActivePage, session, signOut } = useExchangeStore();
    const email = session?.user?.email || "fdr***@gmail.com";
    const uid = session?.user?.id?.replace(/-/g, '').substring(0, 18) || "807262799469809754";

    const handleLogout = async () => {
        await signOut();
        setActivePage('home'); // or 'auth' depending on auth flow, auth view pops up automatically when session is null
    };

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 bg-white z-[300] flex flex-col font-sans overflow-hidden"
        >
            {/* Header */}
            <div className="flex justify-between items-center px-4 pt-[calc(16px+var(--safe-area-top))] pb-3 relative bg-white">
                <button onClick={() => setActivePage('profile')} className="p-2 -ml-2 text-slate-800 active:scale-95 transition-transform absolute left-4">
                    <IoChevronBack size={24} />
                </button>
                <div className="flex-1 text-center">
                    <h1 className="text-[17px] font-bold text-slate-900">User Center</h1>
                </div>
                <button className="p-2 -mr-2 text-slate-800 active:scale-95 transition-transform absolute right-4">
                    <LuUserPlus size={24} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-10">
                {/* Avatar Section */}
                <div className="flex flex-col items-center mt-6 mb-8">
                    <div className="w-[72px] h-[72px] rounded-full bg-slate-200 overflow-hidden relative mb-4">
                        <div className="absolute inset-0 bg-[url('https://api.dicebear.com/7.x/shapes/svg?seed=wave')] bg-cover opacity-80 mix-blend-multiply grayscale contrast-125"></div>
                        <div className="absolute inset-0 w-full h-full object-cover grayscale mix-blend-overlay opacity-50 bg-gradient-to-tr from-black to-transparent" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(0,0,0,0.1) 1px, rgba(0,0,0,0.1) 2px)' }}></div>
                    </div>
                    <h2 className="text-[20px] font-bold text-slate-900 mb-2">{email}</h2>
                    <button className="bg-[#f5f7f9] text-slate-700 px-4 py-1.5 rounded-full text-[13px] font-medium flex items-center gap-1.5 active:scale-95 transition-transform">
                        <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></span>
                        Edit profile
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-6 border-b border-slate-100 mb-6 px-1">
                    <div className="pb-3 border-b-2 border-black -mb-[1px]">
                        <span className="text-[15px] font-bold text-slate-900">Profile</span>
                    </div>
                    <div className="pb-3">
                        <span className="text-[15px] font-medium text-slate-500">Security</span>
                    </div>
                    <div className="pb-3">
                        <span className="text-[15px] font-medium text-slate-500">Preferences</span>
                    </div>
                </div>

                {/* Account info section */}
                <div className="mb-6">
                    <h3 className="text-[15px] font-bold text-slate-900 mb-3 px-1">Account information</h3>

                    <div className="flex justify-between items-center py-4 px-1 border-b border-slate-50 group">
                        <span className="text-[15px] text-slate-800">UID</span>
                        <div className="flex items-center gap-2 text-slate-500">
                            <span className="text-[14px]">{uid}</span>
                            <span className="hover:text-slate-800 cursor-pointer transition-colors"><MdOutlineContentCopy /></span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center py-4 px-1 border-b border-slate-50 cursor-pointer group hover:bg-slate-50 transition-colors -mx-2 px-3">
                        <div className="flex flex-col">
                            <span className="text-[15px] text-slate-800">Identity verification</span>
                            <span className="text-[12px] text-[#00C076] font-medium mt-0.5">Verified</span>
                        </div>
                        <span className="text-slate-400 group-hover:text-slate-600 transition-colors"><IoIosArrowForward /></span>
                    </div>

                    <div className="flex justify-between items-center py-4 px-1 border-b border-slate-50 cursor-pointer group hover:bg-slate-50 transition-colors -mx-2 px-3">
                        <span className="text-[15px] text-slate-800">Country/Region</span>
                        <div className="flex items-center gap-1">
                            <span className="text-[14px] text-slate-500">Indonesia</span>
                            <span className="text-slate-400 group-hover:text-slate-600 transition-colors"><IoIosArrowForward /></span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center py-4 px-1 cursor-pointer group hover:bg-slate-50 transition-colors -mx-2 px-3">
                        <span className="text-[15px] text-slate-800">Trading fee tier</span>
                        <div className="flex items-center gap-1">
                            <span className="text-[14px] text-slate-500">Regular user</span>
                            <span className="text-slate-400 group-hover:text-slate-600 transition-colors"><IoIosArrowForward /></span>
                        </div>
                    </div>
                </div>

                {/* Linked accounts section */}
                <div className="mb-6">
                    <h3 className="text-[15px] font-bold text-slate-900 mb-3 px-1">Linked accounts</h3>

                    <div className="flex justify-between items-center py-4 px-1 border-b border-slate-50 cursor-pointer group hover:bg-slate-50 transition-colors -mx-2 px-3">
                        <span className="text-[15px] text-slate-800">Third-party logins</span>
                        <span className="text-slate-400 group-hover:text-slate-600 transition-colors"><IoIosArrowForward /></span>
                    </div>

                    <div className="flex justify-between items-center py-4 px-1 border-b border-slate-50 cursor-pointer group hover:bg-slate-50 transition-colors -mx-2 px-3">
                        <span className="text-[15px] text-slate-800">Wallet Connect</span>
                        <div className="flex items-center gap-1">
                            <span className="text-[14px] text-slate-500">Linked</span>
                            <span className="text-slate-400 group-hover:text-slate-600 transition-colors"><IoIosArrowForward /></span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center py-4 px-1 cursor-pointer group hover:bg-slate-50 transition-colors -mx-2 px-3">
                        <span className="text-[15px] text-slate-800">X account</span>
                        <div className="flex items-center gap-1">
                            <span className="text-[14px] text-slate-500">Not linked</span>
                            <span className="text-slate-400 group-hover:text-slate-600 transition-colors"><IoIosArrowForward /></span>
                        </div>
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-8">
                    <div className="flex justify-between items-center py-4 px-1 border-b border-slate-50 cursor-pointer group hover:bg-slate-50 transition-colors -mx-2 px-3">
                        <span className="text-[15px] text-slate-800">Switch accounts</span>
                        <span className="text-slate-400 group-hover:text-slate-600 transition-colors"><IoIosArrowForward /></span>
                    </div>

                    <div
                        className="flex justify-between items-center py-4 px-1 cursor-pointer group hover:bg-rose-50 transition-colors -mx-2 px-3"
                        onClick={handleLogout}
                    >
                        <span className="text-[15px] text-[#FF4D5B]">Log out</span>
                        <span className="text-slate-400 group-hover:text-slate-600 transition-colors"><IoIosArrowForward /></span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default UserCenterView;
