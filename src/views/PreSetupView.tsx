import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    RiArrowRightLine, RiCheckLine, RiRocketLine,
    RiSettingsLine, RiWallet3Line, RiBankCardLine
} from 'react-icons/ri';
import useExchangeStore from '../stores/useExchangeStore';

export default function PreSetupView() {
    const { 
        setupStep, setSetupStep, theme, setTheme, currency, setCurrency, 
        completeSetup, setDepositOptionOpen, wallets
    } = useExchangeStore();
    
    const hasFunds = Object.values(wallets.spot).some(v => (v as number) > 0);

    const [direction, setDirection] = useState(1);

    // Auto-advance logic
    React.useEffect(() => {
        // If on step 3 and funds are detected, auto-advance to step 4
        if (setupStep === 3 && hasFunds) {
            setDirection(1);
            setSetupStep(4);
        }
    }, [hasFunds, setupStep, setSetupStep]);

    const nextStep = () => {
        setDirection(1);
        // Special logic for skipping deposit step if user already has funds
        if (setupStep === 2 && hasFunds) {
            setSetupStep(4);
        } else {
            setSetupStep(setupStep + 1);
        }
    };

    const prevStep = () => {
        setDirection(-1);
        // If going back from step 4 and user has funds, they likely skipped step 3, so go to step 2
        if (setupStep === 4 && hasFunds) {
            setSetupStep(2);
        } else {
            setSetupStep(setupStep - 1);
        }
    };

    const stepVariants = {
        enter: (d: number) => ({ x: d > 0 ? 50 : -50, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (d: number) => ({ x: d < 0 ? 50 : -50, opacity: 0 })
    };

    const ThemePreview = ({ type }: { type: 'light' | 'dark' | 'system' }) => {
        return (
            <div className={`w-full aspect-[4/5] rounded-xl border-[1.5px] overflow-hidden flex flex-col relative ${theme === type ? 'border-[var(--text-primary)] shadow-sm' : 'border-[var(--nav-border)] opacity-60'}`}>
                {type === 'system' ? (
                    <div className="absolute inset-0 flex">
                        <div className="flex-1 bg-white" />
                        <div className="flex-1 bg-[#1A1A1A]" />
                    </div>
                ) : (
                    <div className={`absolute inset-0 ${type === 'light' ? 'bg-white' : 'bg-[#1A1A1A]'}`} />
                )}
                
                {/* Mock UI elements */}
                <div className="relative z-10 p-2 space-y-1.5 h-full flex flex-col">
                    <div className="h-2 w-2/3 rounded-full opacity-20 bg-gray-400 mb-1" />
                    <div className="flex gap-1.5">
                        <div className="h-3 flex-1 rounded-full bg-[#34A853]/60" />
                        <div className="h-3 flex-1 rounded-full bg-[#E94335]/60" />
                    </div>
                    <div className="h-8 w-full rounded-md opacity-10 bg-gray-400" />
                    <div className="mt-auto space-y-1">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex justify-between items-center opacity-10">
                                <div className="h-1.5 w-1/2 rounded-full bg-gray-400" />
                                <div className="h-3 w-4 rounded-sm bg-gray-400" />
                            </div>
                        ))}
                    </div>
                </div>
                
                {theme === type && (
                    <div className="absolute top-1.5 right-1.5 z-20 w-4 h-4 rounded-full bg-[var(--text-primary)] flex items-center justify-center">
                        <RiCheckLine color="var(--bg-primary)" size={12} />
                    </div>
                )}
            </div>
        );
    };

    const renderStep = () => {
        switch (setupStep) {
            case 1:
                return (
                    <motion.div 
                        key="step1"
                        custom={direction}
                        variants={stepVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="w-full max-w-[320px] flex flex-col"
                    >
                        <h2 className="text-xl font-bold mb-1 text-center">Appearance</h2>
                        <p className="text-[13px] text-[var(--text-tertiary)] mb-8 text-center px-4 leading-tight">Match your style for a better experience.</p>
                        
                        <div className="grid grid-cols-3 gap-3 mb-10">
                            {[
                                { id: 'system', label: 'System' },
                                { id: 'light', label: 'Light' },
                                { id: 'dark', label: 'Dark' }
                            ].map(opt => (
                                <div 
                                    key={opt.id}
                                    onClick={() => setTheme(opt.id as any)}
                                    className="flex flex-col items-center gap-2 cursor-pointer group"
                                >
                                    < ThemePreview type={opt.id as any} />
                                    <span className={`text-[12px] font-bold ${theme === opt.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>{opt.label}</span>
                                </div>
                            ))}
                        </div>
                        
                        <button 
                            onClick={nextStep}
                            className="h-12 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-full font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            Continue <RiArrowRightLine size={18} />
                        </button>
                    </motion.div>
                );
            case 2:
                return (
                    <motion.div 
                        key="step2"
                        custom={direction}
                        variants={stepVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="w-full max-w-[280px] flex flex-col text-center"
                    >
                        <h2 className="text-xl font-bold mb-1">Base Currency</h2>
                        <p className="text-[13px] text-[var(--text-tertiary)] mb-8">Set your main currency display.</p>
                        
                        <div className="flex gap-2 mb-10 p-1.5 bg-[var(--bg-secondary)] rounded-2xl">
                            {['USD', 'IDR'].map(curr => (
                                <button 
                                    key={curr}
                                    onClick={() => setCurrency(curr as any)}
                                    className={`flex-1 py-3.5 rounded-xl font-bold transition-all ${currency === curr ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'}`}
                                >
                                    {curr}
                                </button>
                            ))}
                        </div>
                        
                        <div className="flex gap-3">
                            <button onClick={prevStep} className="flex-1 h-12 rounded-full font-bold text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">Back</button>
                            <button onClick={nextStep} className="flex-[2] h-12 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-full font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
                                Next
                            </button>
                        </div>
                    </motion.div>
                );
            case 3:
                return (
                    <motion.div 
                        key="step3"
                        custom={direction}
                        variants={stepVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="w-full max-w-[320px] flex flex-col items-center text-center"
                    >
                        <div className="w-14 h-14 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-2xl flex items-center justify-center mb-6">
                            <RiBankCardLine size={28} />
                        </div>
                        <h2 className="text-xl font-bold mb-1">Add Funds</h2>
                        <p className="text-[13px] text-[var(--text-tertiary)] mb-10 px-6 leading-tight">
                            Start trading by adding funds to your account now or skip and do it later.
                        </p>
                        
                        <div className="flex flex-col gap-3 w-full">
                            <button 
                                onClick={() => setDepositOptionOpen(true)}
                                className="w-full h-14 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-full font-bold flex items-center justify-center gap-3 active:scale-95 transition-transform"
                            >
                                <RiWallet3Line size={20} /> Deposit Now
                            </button>
                            <button 
                                onClick={nextStep}
                                className="w-full h-14 rounded-full font-bold text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-[14px]"
                            >
                                I'll do it later
                            </button>
                        </div>
                        
                        <button onClick={prevStep} className="mt-6 text-[12px] font-bold text-[var(--text-quaternary)]">Back</button>
                    </motion.div>
                );
            case 4:
                return (
                    <motion.div 
                        key="step4"
                        custom={direction}
                        variants={stepVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="w-full max-w-[300px] flex flex-col items-center text-center"
                    >
                        <div className="w-16 h-16 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                            <RiRocketLine size={32} />
                        </div>
                        <h2 className="text-2xl font-bold mb-3">Let's start your Crypto journey</h2>
                        <p className="text-[14px] text-[var(--text-tertiary)] mb-10 leading-relaxed px-4">
                            Your personalized trading experience is ready. Get started with the best markets and features.
                        </p>
                        
                        <button 
                            onClick={completeSetup}
                            className="w-full h-14 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-full font-bold text-[17px] shadow-lg active:scale-95 transition-transform"
                        >
                            Open Dashboard
                        </button>
                        
                        <button onClick={prevStep} className="mt-6 text-[13px] font-bold text-[var(--text-tertiary)]">Back</button>
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] bg-[var(--bg-primary)] flex flex-col justify-center items-center overflow-hidden font-sans">
            {/* Minimal Decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--text-primary)] opacity-[0.02] blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
            
            {/* Slim Progress */}
            <div className="absolute top-14 left-1/2 -translate-x-1/2 flex gap-1.5">
                {[1, 2, 3, 4].map(s => (
                    <div 
                        key={s} 
                        className={`w-4 h-1 rounded-full transition-all duration-300 ${s <= setupStep ? 'bg-[var(--text-primary)]' : 'bg-[var(--nav-border)]'}`}
                    />
                ))}
            </div>

            <div className="w-full flex justify-center px-8 relative">
                <AnimatePresence mode="wait" custom={direction}>
                    {renderStep()}
                </AnimatePresence>
            </div>
            
            <div className="absolute bottom-10 text-[10px] uppercase tracking-widest font-black text-[var(--text-quaternary)] opacity-50 flex items-center gap-2">
                <RiSettingsLine /> System Initialization
            </div>
        </div>
    );
}
