import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../utils/supabase';
import useExchangeStore from '../stores/useExchangeStore';
import trivLogo from '../assets/triv-logo.svg';
import { IoChevronBack, IoHelpCircleOutline } from "react-icons/io5";
import { FcGoogle } from "react-icons/fc";
import { FaTelegram } from "react-icons/fa";

const AuthView = () => {
    const [step, setStep] = useState(1); // 1: Welcome, 2: Email, 3: Location
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [country, setCountry] = useState('Indonesia');
    const [loading, setLoading] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
    const { setSession } = useExchangeStore();

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const handleAuth = async () => {
        setLoading(true);
        try {
            let result;
            if (authMode === 'signup') {
                // Real Signup
                result = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            country: country,
                        }
                    }
                });
            } else {
                // Real Login
                result = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
            }

            const { data, error } = result;

            if (error) {
                alert(`Auth Error: ${error.message}`);
                return;
            }

            if (data?.session) {
                setSession(data.session);

                // If signup, insert profile data using the new user ID
                if (authMode === 'signup' && data.user) {
                    const { error: profileError } = await supabase.from('profiles').upsert({
                        id: data.user.id,
                        username: email.split('@')[0],
                        country: country
                    });
                    if (profileError) console.error("Profile creation error:", profileError);
                }
            } else if (data?.user && !data.session) {
                alert("Please check your email to verify your account!");
            }
        } catch (err) {
            console.error('Auth crash:', err);
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        initial: { x: 20, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: -20, opacity: 0 }
    };

    return (
        <div className="fixed inset-0 bg-[var(--bg-primary)] z-[1000] flex flex-col font-sans overflow-hidden">
            {/* Header */}
            <div className="p-4 pt-[calc(16px+var(--safe-area-top))] flex justify-between items-center">
                {step > 1 ? (
                    <button onClick={handleBack} className="p-2 -ml-2">
                        <IoChevronBack size={24} />
                    </button>
                ) : (
                    <div className="w-10" />
                )}
                <span className="text-[var(--text-primary)]"><IoHelpCircleOutline size={24} /></span>
            </div>

            <div className="flex-1 px-6 flex flex-col">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            variants={containerVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="flex-1 flex flex-col pt-2"
                        >
                            <div className="flex justify-center mb-1">
                                <img src={trivLogo} alt="TRIV" className="w-48 h-48" />
                            </div>

                            <h1 className="text-[26px] font-medium leading-tight text-center mb-4">
                                Taking the Lead in<br />Crypto Industry
                            </h1>

                            <div className="mt-auto flex gap-3 mb-12 px-2">
                                <button
                                    onClick={() => { setAuthMode('login'); setStep(2); }}
                                    className="flex-1 py-4 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-bold rounded-full text-[17px] active:scale-[0.98] transition-all"
                                >
                                    Log in
                                </button>
                                <button
                                    onClick={() => { setAuthMode('signup'); setStep(2); }}
                                    className="flex-1 py-4 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-bold rounded-full text-[17px] active:scale-[0.98] transition-all"
                                >
                                    Sign up
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            variants={containerVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="flex-1 flex flex-col pt-4"
                        >
                            <h2 className="text-[28px] font-bold mb-2">
                                {authMode === 'login' ? 'Log in to your account' : "What's your email?"}
                            </h2>
                            <p className="text-[var(--text-secondary)] text-[15px] mb-8 leading-relaxed">
                                {authMode === 'login' ? 'Welcome back! Please enter your details.' : "You'll use this email to login and access everything we have to offer."}
                            </p>

                            <input
                                type="email"
                                placeholder="Enter your email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-5 py-4 bg-[var(--bg-secondary)] rounded-xl text-[16px] outline-none border-2 border-transparent focus:border-[#2D6A1F] transition-all mb-4"
                            />

                            <input
                                type="password"
                                placeholder="Enter a secure password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-5 py-4 bg-[var(--bg-secondary)] rounded-xl text-[16px] outline-none border-2 border-transparent focus:border-[#2D6A1F] transition-all mb-4"
                            />

                            {authMode === 'signup' && (
                                <p className="text-[13px] text-[var(--text-tertiary)] mb-8">
                                    You're invited to join us: <span className="text-[#2D6A1F] font-medium">ACE_aOS_529682</span>
                                </p>
                            )}

                            <button
                                onClick={() => authMode === 'signup' ? handleNext() : handleAuth()}
                                disabled={!email.includes('@') || password.length < 6}
                                className="w-full py-4 bg-[var(--bg-secondary)] text-[var(--text-tertiary)] font-bold rounded-full text-[17px] mb-8 disabled:cursor-not-allowed transition-all enabled:bg-[#3189c6] enabled:text-white"
                            >
                                {authMode === 'login' ? (loading ? 'Logging in...' : 'Log in') : 'Next'}
                            </button>

                            <div className="relative flex items-center justify-center mb-8">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-[var(--border-color)]"></div>
                                </div>
                                <span className="relative px-4 bg-[var(--bg-card)] text-[var(--text-tertiary)] text-[13px]">Or continue with</span>
                            </div>

                            <div className="space-y-3">
                                <button className="w-full py-3.5 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center gap-3 font-bold text-[15px] active:scale-[0.98] transition-all">
                                    <FcGoogle size={20} />
                                    Google
                                </button>
                                <button className="w-full py-3.5 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center gap-3 font-bold text-[15px] active:scale-[0.98] transition-all">
                                    <span className="text-[#24A1DE]"><FaTelegram size={20} /></span>
                                    Telegram
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            variants={containerVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="flex-1 flex flex-col pt-4"
                        >
                            <h2 className="text-[28px] font-bold mb-2">Where do you live?</h2>
                            <p className="text-[var(--text-secondary)] text-[15px] mb-12 leading-relaxed">
                                Your response will be used to set up your account and verify your identity.
                            </p>

                            <div className="space-y-2 mb-8">
                                <label className="text-[var(--text-primary)] font-bold text-[15px]">Country/region</label>
                                <div className="w-full p-4 bg-[var(--bg-secondary)] rounded-xl flex items-center justify-between border-2 border-transparent relative">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">🇮🇩</span>
                                        <span className="font-medium">Indonesia</span>
                                    </div>
                                    <span className="rotate-[270deg]"><IoChevronBack /></span>
                                </div>
                            </div>

                            <div className="flex gap-3 mb-12">
                                <div className="mt-1">
                                    <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#2D6A1F] cursor-pointer" />
                                </div>
                                <p className="text-[13px] text-[var(--text-secondary)] leading-normal">
                                    By creating an account, I agree to OKX <span className="text-[#2D6A1F]">Terms of Service</span>, <span className="text-[#2D6A1F]">Risk and Compliance Disclosure</span>, and <span className="text-[#2D6A1F]">Privacy Notice</span>.
                                </p>
                            </div>

                            <div className="mt-auto mb-10 space-y-4">
                                <button
                                    onClick={handleAuth}
                                    disabled={loading}
                                    className="w-full py-4 bg-[#3189c6] text-white font-bold rounded-full text-[17px] active:scale-[0.98] transition-all flex items-center justify-center"
                                >
                                    {loading ? 'Creating account...' : 'Create account'}
                                </button>
                                <div className="text-center text-[15px]">
                                    <span className="text-[var(--text-secondary)]">Have an account? </span>
                                    <button className="text-[#2D6A1F] font-bold" onClick={() => { setAuthMode('login'); setStep(2); }}>Log in</button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AuthView;
