import React, { useState } from 'react';
import { 
  Shield, ShieldAlert, ShieldCheck, KeyRound, UserCheck, 
  LogIn, UserPlus, ArrowRight, Lock, Unlock, Database, 
  Eye, EyeOff, FileText, CheckCircle2, AlertTriangle, RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { ADMIN_CREDENTIALS } from '../data/mockAuth';

export const AuthPage: React.FC = () => {
  const { 
    currentUser, 
    login, 
    loginAsRole, 
    logout, 
    register, 
    navigateTo, 
    isAdmin,
    authError,
    clearAuthError
  } = useApp();

  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Registration state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAgency, setRegAgency] = useState('Maritime Safety Agency');
  const [regTitle, setRegTitle] = useState('Surveillance Officer');
  const [regRole, setRegRole] = useState<UserRole>('analyst');
  const [regSuccess, setRegSuccess] = useState(false);

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    clearAuthError();

    const targetEmail = (emailInput || ADMIN_CREDENTIALS.email).trim();
    const targetPass = (passwordInput || ADMIN_CREDENTIALS.password).trim();

    const ok = login(targetEmail, targetPass);
    if (ok) {
      setLoginSuccess(true);
      setTimeout(() => {
        setLoginSuccess(false);
        navigateTo('overview');
      }, 700);
    } else {
      setLoginError(authError || 'Sign-in verification failed. Please try again.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) {
      setLoginError('Please provide both your name and operational email address.');
      return;
    }
    register(regName, regEmail, regRole, regAgency, regTitle);
    setRegSuccess(true);
    setTimeout(() => {
      setRegSuccess(false);
      navigateTo('overview');
    }, 700);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 md:p-8 relative overflow-hidden shadow-lg">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-10 bottom-6 opacity-5 pointer-events-none hidden lg:block">
          <Shield className="w-64 h-64 text-sky-300" />
        </div>

        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-950/80 border border-blue-800/80 text-sky-400 font-mono text-xs mb-3">
            <KeyRound className="w-3.5 h-3.5" />
            <span>MARITIME SECURITY CLEARANCE TERMINAL</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Authentication & Role-Based Access Control
          </h1>
          <p className="mt-2 text-slate-300 text-sm leading-relaxed">
            OCEANEYE enforces strict role-based data partitioning. Administrators possess Level-5 Top Secret clearance to view covert naval SIGINT, issue seizure warrants, modify live incident geometries, and recalibrate vessel attribution metrics.
          </p>

          {/* Current Active Session Card */}
          <div className="mt-6 p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-inner ${
                currentUser.role === 'admin' 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                  : currentUser.role === 'analyst'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                {currentUser.role === 'admin' ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-base">{currentUser.name}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                    currentUser.role === 'admin'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : currentUser.role === 'analyst'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    Level {currentUser.clearanceLevel}: {currentUser.role.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {currentUser.title} • {currentUser.agency}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono mt-1">
                  <span>Badge: {currentUser.badgeNumber || 'N/A'}</span>
                  <span>•</span>
                  <span>Session: AES-256-GCM Verified</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {isAdmin && (
                <button
                  onClick={() => navigateTo('admin')}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Open Admin Console</span>
                </button>
              )}
              <button
                onClick={logout}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Role Switcher / Demo One-Click Access Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 font-mono flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-blue-600" />
            <span>Instant Role Clearance Switcher (Interactive Testing)</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">Select any tier to instantly experience permissions</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Admin Card */}
          <div 
            onClick={() => loginAsRole('admin')}
            className={`cursor-pointer p-5 rounded-xl border transition-all duration-200 relative group ${
              currentUser.role === 'admin'
                ? 'bg-amber-950/20 border-amber-500 shadow-md ring-1 ring-amber-500/30'
                : 'bg-white border-slate-200 hover:border-amber-400 hover:shadow-md'
            }`}
          >
            {currentUser.role === 'admin' && (
              <span className="absolute top-3 right-3 text-[10px] font-mono font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> ACTIVE
              </span>
            )}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Administrator: Pranav Naik</h3>
                <p className="text-xs text-amber-700 font-mono font-semibold">Clearance Level 5 (Top Secret) • {ADMIN_CREDENTIALS.email}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              <strong>Can see:</strong> Classified naval intercepts, Interpol Purple Notices, dark fleet RF tracking, and covert raw SAR calibration.
              <br />
              <strong>Can modify:</strong> Add/edit incidents, override vessel attribution scores, add penalty flags, and manage system users.
            </p>

            <button
              onClick={(e) => {
                e.stopPropagation();
                loginAsRole('admin');
              }}
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                currentUser.role === 'admin'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-100 hover:bg-amber-500 hover:text-slate-950 text-slate-700'
              }`}
            >
              <span>{currentUser.role === 'admin' ? 'Active Clearance' : 'Switch to Administrator'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Analyst Card */}
          <div 
            onClick={() => loginAsRole('analyst')}
            className={`cursor-pointer p-5 rounded-xl border transition-all duration-200 relative group ${
              currentUser.role === 'analyst'
                ? 'bg-sky-950/10 border-sky-500 shadow-md ring-1 ring-sky-500/30'
                : 'bg-white border-slate-200 hover:border-sky-400 hover:shadow-md'
            }`}
          >
            {currentUser.role === 'analyst' && (
              <span className="absolute top-3 right-3 text-[10px] font-mono font-bold bg-sky-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> ACTIVE
              </span>
            )}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Maritime Analyst</h3>
                <p className="text-xs text-sky-700 font-mono font-semibold">Clearance Level 3 (Operational)</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              <strong>Can see:</strong> Full Copernicus SAR detections, hydrodynamic backtrack trajectories, and AIS correlation data.
              <br />
              <strong>Restricted:</strong> Cannot view covert naval intercepts, cannot override attribution scores or alter system users.
            </p>

            <button
              onClick={(e) => {
                e.stopPropagation();
                loginAsRole('analyst');
              }}
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                currentUser.role === 'analyst'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 hover:bg-sky-600 hover:text-white text-slate-700'
              }`}
            >
              <span>{currentUser.role === 'analyst' ? 'Active Clearance' : 'Switch to Analyst'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Public Observer Card */}
          <div 
            onClick={() => loginAsRole('public')}
            className={`cursor-pointer p-5 rounded-xl border transition-all duration-200 relative group ${
              currentUser.role === 'public'
                ? 'bg-emerald-950/10 border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                : 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-md'
            }`}
          >
            {currentUser.role === 'public' && (
              <span className="absolute top-3 right-3 text-[10px] font-mono font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> ACTIVE
              </span>
            )}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Public Observer</h3>
                <p className="text-xs text-emerald-700 font-mono font-semibold">Clearance Level 1 (Public Registry)</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              <strong>Can see:</strong> General incident awareness maps, public environmental spill polygons, and declassified dossiers.
              <br />
              <strong>Restricted:</strong> Classified naval feeds and vessel suspect seizure files are hidden. Data modification is fully locked.
            </p>

            <button
              onClick={(e) => {
                e.stopPropagation();
                loginAsRole('public');
              }}
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                currentUser.role === 'public'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700'
              }`}
            >
              <span>{currentUser.role === 'public' ? 'Active Clearance' : 'Switch to Public'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Authentication Form & Role Matrix Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sign In / Registration Terminal */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex border-b border-slate-200 mb-6">
            <button
              onClick={() => setActiveTab('signin')}
              className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'signin'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Officer Sign In</span>
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'register'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Request Clearance Registration</span>
            </button>
          </div>

          {activeTab === 'signin' ? (
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              {/* Official Administrator Credentials Callout */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/50 text-xs shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 font-bold text-amber-300">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-mono uppercase tracking-wider text-[11px]">Administrator Login Credentials</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                    LEVEL-5 CLEARANCE
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs mb-3">
                  <div className="p-2.5 rounded-lg bg-slate-950/90 border border-amber-500/30">
                    <span className="text-slate-400 block text-[10px] uppercase font-sans font-semibold mb-0.5">Admin Email:</span>
                    <span className="text-amber-200 font-bold select-all tracking-wide text-[11px] break-all">{ADMIN_CREDENTIALS.email}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/90 border border-amber-500/30">
                    <span className="text-slate-400 block text-[10px] uppercase font-sans font-semibold mb-0.5">Admin Password:</span>
                    <span className="text-amber-200 font-bold select-all tracking-wide text-[11px]">{ADMIN_CREDENTIALS.password}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEmailInput(ADMIN_CREDENTIALS.email);
                      setPasswordInput(ADMIN_CREDENTIALS.password);
                      setLoginError('');
                      clearAuthError();
                    }}
                    className="flex-1 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Auto-Fill Admin Credentials</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailInput(ADMIN_CREDENTIALS.email);
                      setPasswordInput(ADMIN_CREDENTIALS.password);
                      setLoginError('');
                      clearAuthError();
                      const ok = login(ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
                      if (ok) {
                        setLoginSuccess(true);
                        setTimeout(() => {
                          setLoginSuccess(false);
                          navigateTo('overview');
                        }, 900);
                      }
                    }}
                    className="py-2 px-3.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold text-xs border border-amber-500/40 transition-colors"
                  >
                    1-Click Admin Sign In
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {loginSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Authentication authorized! Level-5 Administrator clearance unlocked...</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Maritime Agency Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="e.g. pranav.naik24@spit.ac.in"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-400">Quick Fill:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailInput(ADMIN_CREDENTIALS.email);
                      setPasswordInput(ADMIN_CREDENTIALS.password);
                    }}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-bold"
                  >
                    {ADMIN_CREDENTIALS.email} (Admin)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailInput('analyst@oceaneye.org');
                      setPasswordInput('analyst2026');
                    }}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100"
                  >
                    analyst@oceaneye.org (Analyst)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailInput('visitor@oceaneye.org');
                      setPasswordInput('visitor');
                    }}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                  >
                    visitor@oceaneye.org (Public)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Security Passkey / Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter security passkey"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-mono">
                  Admin passkey required: <span className="font-bold text-amber-700">LoveIsAllAboutGiving</span>
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Authenticate Session</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {regSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Clearance profile granted! Loading active session...</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Officer Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Capt. Sarah Jenkins"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Agency Email
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="s.jenkins@uscg.mil"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Organization / Department
                  </label>
                  <input
                    type="text"
                    value={regAgency}
                    onChange={(e) => setRegAgency(e.target.value)}
                    placeholder="Port State Control / Coast Guard"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Duty Title
                  </label>
                  <input
                    type="text"
                    value={regTitle}
                    onChange={(e) => setRegTitle(e.target.value)}
                    placeholder="Senior Marine Inspector"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Requested Operational Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <label className={`cursor-pointer p-2.5 rounded-lg border text-center transition-colors ${
                    regRole === 'admin' 
                      ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={regRole === 'admin'}
                      onChange={() => setRegRole('admin')}
                      className="sr-only"
                    />
                    <div className="text-xs font-bold">Admin</div>
                    <div className="text-[10px] text-amber-700 font-mono">Level 5</div>
                  </label>

                  <label className={`cursor-pointer p-2.5 rounded-lg border text-center transition-colors ${
                    regRole === 'analyst' 
                      ? 'border-sky-500 bg-sky-50 text-sky-900 font-bold' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="analyst"
                      checked={regRole === 'analyst'}
                      onChange={() => setRegRole('analyst')}
                      className="sr-only"
                    />
                    <div className="text-xs font-bold">Analyst</div>
                    <div className="text-[10px] text-sky-700 font-mono">Level 3</div>
                  </label>

                  <label className={`cursor-pointer p-2.5 rounded-lg border text-center transition-colors ${
                    regRole === 'public' 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="public"
                      checked={regRole === 'public'}
                      onChange={() => setRegRole('public')}
                      className="sr-only"
                    />
                    <div className="text-xs font-bold">Public</div>
                    <div className="text-[10px] text-emerald-700 font-mono">Level 1</div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Set Encryption Passkey
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Provision Clearance Account</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security Clearance Comparison Table */}
        <div className="lg:col-span-6 bg-slate-900 rounded-2xl border border-slate-800 p-6 text-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-2">
            <Lock className="w-3.5 h-3.5" />
            <span>ROLE-BASED ACCESS CONTROL (RBAC) DIRECTIVE</span>
          </div>

          <h3 className="text-lg font-bold text-white mb-2">
            What Different Roles Can See and Do
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Compare data visibility and editing privileges across operational levels.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono">
                  <th className="py-2.5 pr-3">Feature & Capability</th>
                  <th className="py-2.5 px-2 text-center text-amber-300 font-bold">Admin (L5)</th>
                  <th className="py-2.5 px-2 text-center text-sky-300 font-bold">Analyst (L3)</th>
                  <th className="py-2.5 pl-2 text-center text-emerald-300 font-bold">Public (L1)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                <tr>
                  <td className="py-3 pr-3 text-slate-300 font-medium">
                    <div>Covert Defense & Naval ELINT Intercepts</div>
                    <div className="text-[10px] text-slate-500">Dark fleet radar, jamming alerts, warrants</div>
                  </td>
                  <td className="py-3 px-2 text-center text-emerald-400 font-bold font-mono">UNRESTRICTED</td>
                  <td className="py-3 px-2 text-center text-rose-400 font-mono text-[11px]">LOCKED</td>
                  <td className="py-3 pl-2 text-center text-rose-400 font-mono text-[11px]">LOCKED</td>
                </tr>

                <tr>
                  <td className="py-3 pr-3 text-slate-300 font-medium">
                    <div>Modify Live Incident Data & Geometries</div>
                    <div className="text-[10px] text-slate-500">Edit severity, slick volume, area, status</div>
                  </td>
                  <td className="py-3 px-2 text-center text-emerald-400 font-bold font-mono">FULL EDIT</td>
                  <td className="py-3 px-2 text-center text-slate-400 font-mono text-[11px]">READ ONLY</td>
                  <td className="py-3 pl-2 text-center text-slate-400 font-mono text-[11px]">READ ONLY</td>
                </tr>

                <tr>
                  <td className="py-3 pr-3 text-slate-300 font-medium">
                    <div>Vessel Attribution Score & Penalty Override</div>
                    <div className="text-[10px] text-slate-500">Recalculate suspect rank, add legal flags</div>
                  </td>
                  <td className="py-3 px-2 text-center text-emerald-400 font-bold font-mono">FULL EDIT</td>
                  <td className="py-3 px-2 text-center text-slate-400 font-mono text-[11px]">READ ONLY</td>
                  <td className="py-3 pl-2 text-center text-slate-400 font-mono text-[11px]">READ ONLY</td>
                </tr>

                <tr>
                  <td className="py-3 pr-3 text-slate-300 font-medium">
                    <div>Add New Spill Targets & Sensor Feeds</div>
                    <div className="text-[10px] text-slate-500">Ingest radar files, synthesize oil parameters</div>
                  </td>
                  <td className="py-3 px-2 text-center text-emerald-400 font-bold font-mono">YES</td>
                  <td className="py-3 px-2 text-center text-emerald-400 font-bold font-mono">YES</td>
                  <td className="py-3 pl-2 text-center text-rose-400 font-mono text-[11px]">NO</td>
                </tr>

                <tr>
                  <td className="py-3 pr-3 text-slate-300 font-medium">
                    <div>User Clearance Management & Audit Trail</div>
                    <div className="text-[10px] text-slate-500">Promote roles, view timestamped action ledger</div>
                  </td>
                  <td className="py-3 px-2 text-center text-emerald-400 font-bold font-mono">FULL ADMIN</td>
                  <td className="py-3 px-2 text-center text-rose-400 font-mono text-[11px]">NO</td>
                  <td className="py-3 pl-2 text-center text-rose-400 font-mono text-[11px]">NO</td>
                </tr>

                <tr>
                  <td className="py-3 pr-3 text-slate-300 font-medium">
                    <div>Public Oil Spill Map & Drift Projection</div>
                    <div className="text-[10px] text-slate-500">Environmental boundary and trajectory</div>
                  </td>
                  <td className="py-3 px-2 text-center text-emerald-400 font-bold font-mono">YES</td>
                  <td className="py-3 px-2 text-center text-emerald-400 font-bold font-mono">YES</td>
                  <td className="py-3 pl-2 text-center text-emerald-400 font-bold font-mono">YES</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Shield className="w-4 h-4 text-sky-400" />
              <span>Compliant with ISO/IEC 27001 Maritime Cloud Standard</span>
            </div>
            {isAdmin && (
              <button
                onClick={() => navigateTo('admin')}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono"
              >
                <span>Manage Data in Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
