import React from 'react';
import useExchangeStore from '../stores/useExchangeStore';
import { IoChevronBack, IoScanOutline } from "react-icons/io5";
import { FiHeadphones } from 'react-icons/fi';
import { LuUser } from "react-icons/lu";
import { IoIosArrowForward } from "react-icons/io";
import { MdClose } from "react-icons/md";
import { IoTicketOutline } from "react-icons/io5";
import { FiGift } from "react-icons/fi";
import { BsMegaphone } from "react-icons/bs";
import { HiOutlineUserCircle } from "react-icons/hi2";
import { BiCoinStack } from "react-icons/bi";
import { HiOutlineExternalLink } from "react-icons/hi";

const ProfileView = () => {
    const { setActivePage, session } = useExchangeStore();
    const email = session?.user?.email || "fdr***@gmail.com";

    // Mask email for display
    const maskedEmail = React.useMemo(() => {
        if (!email) return "fdr***@gmail.com";
        const [user, domain] = email.split('@');
        if (!user || !domain) return "fdr***@gmail.com";
        return `${user.substring(0, 3)}***@${domain}`;
    }, [email]);

    return (
        <div className="fixed inset-0 bg-white z-[300] flex flex-col font-sans overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center px-4 pt-[calc(16px+var(--safe-area-top))] pb-3 bg-white">
                <button onClick={() => setActivePage('home')} className="p-2 -ml-2 text-slate-800 active:scale-95 transition-transform">
                    <IoChevronBack size={24} />
                </button>
                <div className="flex items-center gap-4 text-slate-800">
                    <button className="active:scale-95 transition-transform"><FiHeadphones size={24} /></button>
                    <button className="active:scale-95 transition-transform"><IoScanOutline size={24} /></button>
                    <button className="active:scale-95 transition-transform"><LuUser size={24} /></button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-10">
                {/* Profile Header section */}
                <div
                    className="flex justify-between items-center mt-2 mb-6 cursor-pointer"
                    onClick={() => setActivePage('user-center')}
                >
                    <div className="flex items-center gap-3">
                        {/* Avatar placeholder with noise/gradient style from mockup */}
                        <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden relative">
                            <div className="absolute inset-0 bg-[url('https://api.dicebear.com/7.x/shapes/svg?seed=wave')] bg-cover opacity-80 mix-blend-multiply grayscale contrast-125"></div>
                            {/* Fallback if external image fails */}
                            <div className="absolute inset-0 w-full h-full object-cover grayscale mix-blend-overlay opacity-50 bg-gradient-to-tr from-black to-transparent" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(0,0,0,0.1) 1px, rgba(0,0,0,0.1) 2px)' }}></div>
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-[22px] font-bold text-slate-900 leading-tight tracking-tight">{maskedEmail}</h2>
                            <span className="text-[14px] text-slate-500 font-medium">Profile and settings</span>
                            <div className="flex gap-2 mt-1.5">
                                <span className="px-2 py-0.5 rounded border border-[#00C076] text-[#00C076] text-[11px] font-medium bg-[#f0fbf6]">Verified</span>
                                <span className="px-2 py-0.5 rounded border border-slate-300 text-slate-600 text-[11px] font-medium">Regular user</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-slate-400">
                        <IoIosArrowForward size={20} />
                    </div>
                </div>

                {/* VIP Banner */}
                <div className="bg-[#fcfaf7] border border-[#f0e8d5] rounded-2xl p-4 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at top right, #c19a6b, transparent 70%)' }}></div>
                    {/* Abstract background lines */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0,50 Q100,0 200,50 T400,50" fill="none" stroke="#c19a6b" strokeWidth="1" />
                            <path d="M0,80 Q150,20 300,80 T600,80" fill="none" stroke="#c19a6b" strokeWidth="1" />
                        </svg>
                    </div>

                    <div className="flex justify-between items-start mb-3 relative z-10">
                        <div className="flex items-center text-[#b88c51]">
                            <span className="text-[17px] font-normal tracking-wide">Unlock TRIV VIP</span>
                            <div className="mt-0.5 ml-0.5"><IoIosArrowForward /></div>
                        </div>
                        <button className="text-slate-400 p-1 -mr-1 -mt-1"><MdClose size={18} /></button>
                    </div>
                    <div className="flex justify-between text-[#8c6b36] relative z-10 text-[13px] font-medium pr-4 mt-4">
                        <div className="flex items-start gap-1.5 flex-1">
                            <span className="text-[#c19a6b] font-bold mt-[2px]">%</span>
                            <span className="leading-tight">Discounted<br />fees</span>
                        </div>
                        <div className="flex items-start gap-1.5 flex-1 justify-center">
                            <div className="text-[#c19a6b] mt-[3px]"><HiOutlineExternalLink /></div>
                            <span className="leading-tight">Boosted yield</span>
                        </div>
                        <div className="flex items-start gap-1.5 flex-1 justify-end">
                            <div className="text-[#c19a6b] mt-[3px]"><FiHeadphones /></div>
                            <span className="leading-tight">Priority<br />support</span>
                        </div>
                    </div>
                </div>

                {/* Shortcuts */}
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-[20px] font-bold text-slate-900">Shortcuts</h3>
                        <button className="p-1 text-slate-400">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        {[
                            { label: 'Earn', icon: <div className="relative"><span className="text-slate-800"><BiCoinStack size={28} /></span><div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full border-2 border-slate-800 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-slate-800 rounded-full" /></div></div> },
                            { label: 'My rewards', icon: <span className="text-slate-800"><IoTicketOutline size={28} /></span> },
                            { label: 'Referral', icon: <span className="text-slate-800"><FiGift size={28} /></span> },
                            { label: 'Campaign\ncenter', icon: <span className="text-slate-800"><BsMegaphone size={28} /></span> }
                        ].map((item, idx) => (
                            <div key={idx} className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform">
                                <div className="h-12 w-12 flex items-center justify-center mb-1">
                                    {item.icon}
                                </div>
                                <span className="text-[12px] font-medium text-slate-700 text-center leading-tight whitespace-pre-line">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileView;
