import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, KeyRound, Loader2, ArrowRight, ShieldCheck, Zap, CheckCircle2 } from 'lucide-react';
import Chat from './Chat';

function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('candy_email')); 
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1); // 1: Credentials, 2: OTP
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  // 🚨 Smart Timer State for Render Cold Start
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef(null);

  // Backend URL - Vite Environment Variable
  const API_URL = import.meta.env.VITE_BACKEND_URL;

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  // --- Login & Signup Handler ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setCountdown(50); // टाइमर 50 सेकंड से शुरू

    // ⏱️ टाइमर चालू करें (हर 1 सेकंड में घटेगा)
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      if (isLogin) {
        const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
        clearInterval(timerRef.current); // सफलता पर टाइमर रोक दें
        showToast('Access Granted! Welcome back, Agent.', 'success');
        localStorage.setItem('candy_email', email);
        setTimeout(() => setIsAuthenticated(true), 1000);
      } else {
        const res = await axios.post(`${API_URL}/api/auth/signup`, { email, password });
        clearInterval(timerRef.current); // सफलता पर टाइमर रोक दें
        showToast(res.data.message || 'OTP Sent to Secure Email', 'success');
        setStep(2); 
      }
    } catch (error) {
      clearInterval(timerRef.current); // एरर आने पर टाइमर रोक दें
      showToast(error.response?.data?.message || 'Connection Failed', 'error');
    } finally {
      setIsLoading(false);
      setCountdown(0); // टाइमर रिसेट करें
    }
  };

  // --- OTP Verification Handler ---
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/verify-otp`, { email, otp });
      showToast('Account Verified! You can now login.', 'success');
      setStep(1);
      setIsLogin(true);
      setOtp('');
    } catch (error) {
      showToast(error.response?.data?.message || 'Invalid or Expired OTP', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Log Out Function
  const handleLogout = () => {
    localStorage.removeItem('candy_email');
    localStorage.removeItem('candy_userName');
    localStorage.removeItem('candy_userPic');
    setIsAuthenticated(false);
  };

  // Cleanup timer on unmount (सुरक्षा के लिए)
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Redirect to Chat if Authenticated
  if (isAuthenticated) {
    return <Chat onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center relative overflow-hidden bg-slate-950">
      {/* --- Animated Background Gradients --- */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-slate-900 to-purple-900/20 animate-pulse" />
      
      {/* --- Floating Glowing Orbs --- */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] mix-blend-screen animate-bounce" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] mix-blend-screen animate-bounce" style={{ animationDuration: '10s', animationDelay: '2s' }} />

      <div className="w-full max-w-md p-4 relative z-10">
        
        {/* --- Toast Notification --- */}
        <AnimatePresence>
          {toast.show && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className={`absolute -top-16 left-0 right-0 p-3 rounded-xl backdrop-blur-md border text-center font-medium shadow-2xl z-50 ${
                toast.type === 'error' 
                  ? 'bg-red-500/10 border-red-500/50 text-red-400' 
                  : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
              }`}
            >
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-slate-900/60 backdrop-blur-2xl border border-slate-700/50 p-8 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)]"
        >
          {/* --- Header --- */}
          <div className="text-center mb-8">
            <motion.div 
              className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 shadow-lg shadow-purple-500/30 mb-4"
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
            >
              <Zap className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              Candy Chat
            </h1>
            <p className="text-slate-400 mt-2 text-sm font-medium">
              {step === 2 ? 'Security Verification' : (isLogin ? 'WELCOME BACK AGENT!!' : 'HEARTLY WELCOMES YOU!!')}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form 
                key="auth-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleAuth}
                className="space-y-5"
              >
                <div className="space-y-4">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    <input
                      type="email" required
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-11 py-3.5 text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                    <input
                      type="password" required
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-11 py-3.5 text-slate-200 focus:outline-none focus:border-purple-500/50 transition-all"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                  className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3.5 px-4 shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all disabled:opacity-70"
                >
                  <div className="flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">
                          {countdown > 0 && countdown < 49 
                            ? `Waking up server... (${countdown}s)` 
                            : 'Connecting...'}
                        </span>
                      </>
                    ) : (
                      <>
                        <span>{isLogin ? 'Initialize Login' : 'Create Access Key'}</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </div>
                </motion.button>

                <div className="text-center mt-6">
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
                  >
                    {isLogin ? "New Agent? " : "Already an Agent? "}
                    <span className="text-purple-400 underline decoration-purple-500/30 underline-offset-4">
                      {isLogin ? 'Sign up' : 'Login'}
                    </span>
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.form 
                key="otp-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyOTP}
                className="space-y-6"
              >
                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-center">
                  <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                  <p className="text-slate-300 text-sm">
                    Verification code sent to<br/>
                    <span className="font-bold text-white">{email}</span>
                  </p>
                </div>

                <div className="relative group">
                  <KeyRound className="absolute left-4 top-4 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                  <input
                    type="text" maxLength="6" required
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-12 py-4 text-center text-2xl tracking-[0.5em] font-bold text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading || otp.length < 6}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-4 px-4 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Authenticate'}
                </motion.button>
                
                <div className="text-center">
                  <button type="button" onClick={() => setStep(1)} className="text-xs text-slate-500 hover:text-white underline underline-offset-4 transition-colors">Back to Signup</button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

export default App;