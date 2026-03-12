import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../utils/supabase';
import useExchangeStore from '../stores/useExchangeStore';
import trivLogo from '../assets/triv-logo.svg';
import { IoChevronBack, IoHelpCircleOutline, IoMailOpenOutline } from "react-icons/io5";
import { FcGoogle } from "react-icons/fc";
import { FaTelegram } from "react-icons/fa";
import { FiEye, FiEyeOff, FiCheck as Check } from "react-icons/fi";

const AuthView = () => {
    const [step, setStep] = useState(1); // 1: Welcome, 2: Email, 3: Location
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [country, setCountry] = useState('Indonesia');
    const [loading, setLoading] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
    const [showPassword, setShowPassword] = useState(false);
    const [isAgreed, setIsAgreed] = useState(true);
    const { setSession, showToast } = useExchangeStore();

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
                showToast('Authentication Error', error.message, 'error');
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
                setStep(4);
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
                                className="w-full px-5 py-4 bg-[var(--bg-secondary)] rounded-xl text-[16px] outline-none border-2 border-transparent focus:border-[var(--text-secondary)] transition-all mb-4"
                            />

                            <div className="relative mb-4">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter a secure password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-5 py-4 bg-[var(--bg-secondary)] rounded-xl text-[16px] outline-none border-2 border-transparent focus:border-[var(--text-secondary)] transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] p-1 transition-colors"
                                >
                                    {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                                </button>
                            </div>


                            <button
                                onClick={() => authMode === 'signup' ? handleNext() : handleAuth()}
                                disabled={!email.includes('@') || password.length < 6}
                                className="w-full py-4 bg-[var(--bg-secondary)] text-[var(--text-tertiary)] font-bold rounded-full text-[17px] mb-8 disabled:cursor-not-allowed transition-all enabled:bg-[var(--accent)] enabled:text-white"
                            >
                                {authMode === 'login' ? (loading ? 'Logging in...' : 'Log in') : 'Next'}
                            </button>

                            <div className="relative flex items-center justify-center mb-8">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-[var(--border-color)]"></div>
                                </div>
                                <span className="relative px-4 bg-[var(--bg-primary)] text-[var(--text-tertiary)] text-[13px]">Or continue with</span>
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
                                    <div 
                                        onClick={() => setIsAgreed(!isAgreed)}
                                        className={`w-5 h-5 rounded-[4px] flex items-center justify-center border cursor-pointer transition-colors ${isAgreed ? 'bg-[var(--green)] border-[var(--green)]' : 'border-[var(--border-strong)] bg-[var(--bg-secondary)]'}`}
                                    >
                                        {isAgreed && <Check size={14} color="white" />}
                                    </div>
                                </div>
                                <p className="text-[13px] text-[var(--text-secondary)] leading-normal">
                                    By creating an account, I agree to TRIV <span className="text-[var(--green)]">Terms of Service</span>, <span className="text-[var(--green)]">Risk and Compliance Disclosure</span>, and <span className="text-[var(--green)]">Privacy Notice</span>.
                                </p>
                            </div>

                            <div className="mt-auto mb-10 space-y-4">
                                <button
                                    onClick={handleAuth}
                                    disabled={loading}
                                    className="w-full py-4 bg-[var(--accent)] text-white font-bold rounded-full text-[17px] active:scale-[0.98] transition-all flex items-center justify-center"
                                >
                                    {loading ? 'Creating account...' : 'Create account'}
                                </button>
                                <div className="text-center text-[15px]">
                                    <span className="text-[var(--text-secondary)]">Have an account? </span>
                                    <button className="text-[var(--green)] font-bold" onClick={() => { setAuthMode('login'); setStep(2); }}>Log in</button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 4 && (
                        <motion.div
                            key="step4"
                            variants={containerVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="flex-1 flex flex-col pt-12 items-center text-center"
                        >
                            <div className="w-24 h-24 bg-[var(--accent)]/10 rounded-full flex items-center justify-center mb-8">
                                <div className="text-[var(--accent)]">
                                    <IoMailOpenOutline size={40} />
                                </div>
                            </div>

                            <h2 className="text-[28px] font-bold mb-4">Check your email</h2>
                            <p className="text-[var(--text-secondary)] text-[16px] mb-12 leading-relaxed px-4">
                                We've sent a verification link to <br />
                                <span className="text-[var(--text-primary)] font-bold">{email}</span>. <br />
                                Please verify your account to continue.
                            </p>

                            <div className="w-full mt-auto mb-10 space-y-4">
                                <button
                                    onClick={() => {
                                        setAuthMode('login');
                                        setStep(2);
                                        // Clear sensitive state but keep email for convenience?
                                        setPassword('');
                                    }}
                                    className="w-full py-4 bg-[var(--accent)] text-white font-bold rounded-full text-[17px] active:scale-[0.98] transition-all"
                                >
                                    Back to Log in
                                </button>
                                <p className="text-[14px] text-[var(--text-secondary)]">
                                    Didn't receive email? <button className="text-[var(--green)] font-bold">Resend</button>
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AuthView;
