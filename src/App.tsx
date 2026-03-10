/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Edit2, Check, ArrowRight, TrendingUp, TrendingDown, AlertTriangle, Calculator, Plus, X, ChevronDown, Sun, Moon } from 'lucide-react';

interface RiskPreset {
  id: string;
  name: string;
  percentage: number;
}

const DEFAULT_PRESETS: RiskPreset[] = [
  { id: '1', name: 'Low', percentage: 1 },
  { id: '2', name: 'Med', percentage: 2 },
  { id: '3', name: 'High', percentage: 5 },
];

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [capital, setCapital] = useState<number | null>(null);
  const [isEditingCapital, setIsEditingCapital] = useState(false);
  const [tempCapital, setTempCapital] = useState('');

  const [leverage, setLeverage] = useState<string>('10');
  const [riskAmount, setRiskAmount] = useState<string>('');
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [slPrice, setSlPrice] = useState<string>('');

  const [activeRR, setActiveRR] = useState<number>(2);
  const [customRR, setCustomRR] = useState<string>('');

  const [presets, setPresets] = useState<RiskPreset[]>(DEFAULT_PRESETS);
  const [showAddPreset, setShowAddPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetPct, setNewPresetPct] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (storedTheme) setTheme(storedTheme);
    
    const storedCapital = localStorage.getItem('tradingCapital');
    if (storedCapital) setCapital(parseFloat(storedCapital));
    
    const storedPresets = localStorage.getItem('riskPresets');
    if (storedPresets) {
      try {
        setPresets(JSON.parse(storedPresets));
      } catch (e) {}
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.backgroundColor = '#09090b';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.backgroundColor = '#fafafa';
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setShowAddPreset(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSaveCapital = () => {
    const parsed = parseFloat(tempCapital);
    if (!isNaN(parsed) && parsed > 0) {
      setCapital(parsed);
      localStorage.setItem('tradingCapital', parsed.toString());
      setIsEditingCapital(false);
    }
  };

  const handleSavePreset = () => {
    const pct = parseFloat(newPresetPct);
    if (newPresetName && !isNaN(pct) && pct > 0) {
      const newPreset = {
        id: Date.now().toString(),
        name: newPresetName,
        percentage: pct,
      };
      const updatedPresets = [...presets, newPreset];
      setPresets(updatedPresets);
      localStorage.setItem('riskPresets', JSON.stringify(updatedPresets));
      setShowAddPreset(false);
      setNewPresetName('');
      setNewPresetPct('');
    }
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedPresets = presets.filter(p => p.id !== id);
    setPresets(updatedPresets);
    localStorage.setItem('riskPresets', JSON.stringify(updatedPresets));
  };

  if (!isLoaded) return null;

  const l = parseFloat(leverage);
  const r = parseFloat(riskAmount);
  const e = parseFloat(entryPrice);
  const s = parseFloat(slPrice);

  let quantity = 0;
  let positionSize = 0;
  let marginRequired = 0;
  let riskPercentage = 0;
  let isLong = true;
  let isValid = false;
  let targetPrice = 0;
  let potentialProfit = 0;

  const currentRR = customRR && !isNaN(parseFloat(customRR)) ? parseFloat(customRR) : activeRR;

  if (!isNaN(l) && !isNaN(r) && !isNaN(e) && !isNaN(s) && e !== s && l > 0 && r > 0 && e > 0 && s > 0) {
    isValid = true;
    isLong = e > s;
    const priceDiff = Math.abs(e - s);
    quantity = r / priceDiff;
    positionSize = quantity * e;
    marginRequired = positionSize / l;
    if (capital) {
      riskPercentage = (r / capital) * 100;
    }
    targetPrice = isLong ? e + (priceDiff * currentRR) : e - (priceDiff * currentRR);
    potentialProfit = r * currentRR;
  }

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans selection:bg-blue-500/30 bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-50 transition-colors duration-300">
      
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6">
        <button 
          onClick={toggleTheme}
          className="p-2.5 rounded-full bg-white dark:bg-[#121214] border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 shadow-sm transition-all"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {capital === null ? (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-md w-full bg-white dark:bg-[#121214] p-8 rounded-[2rem] border border-zinc-200 dark:border-white/5 shadow-2xl"
          >
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-100 dark:border-blue-500/20">
              <Calculator className="text-blue-600 dark:text-blue-500" size={28} />
            </div>
            <h1 className="text-4xl font-light tracking-tight mb-3">Welcome.</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mb-8 text-base leading-relaxed">
              Let's set up your trading capital to calculate precise position sizes and manage your risk effectively.
            </p>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest mb-2">
                  Trading Capital (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 font-mono text-lg">₹</span>
                  <input
                    type="number"
                    value={tempCapital}
                    onChange={e => setTempCapital(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-white/10 rounded-2xl py-4 pl-9 pr-4 text-2xl font-mono focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-zinc-900 dark:text-zinc-100"
                    placeholder="100000"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveCapital()}
                  />
                </div>
              </div>
              <button
                onClick={handleSaveCapital}
                disabled={!tempCapital || isNaN(parseFloat(tempCapital)) || parseFloat(tempCapital) <= 0}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-100 dark:disabled:bg-white/5 disabled:text-zinc-400 dark:disabled:text-zinc-500 text-white rounded-2xl py-4 text-base font-medium transition-all flex items-center justify-center gap-2"
              >
                Continue <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="calculator"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-md w-full"
          >
            {/* Header / Capital */}
            <div className="bg-white dark:bg-[#121214] rounded-3xl p-5 mb-5 border border-zinc-200 dark:border-white/5 flex items-center justify-between shadow-lg">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1">Trading Capital</p>
                {isEditingCapital ? (
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400 dark:text-zinc-500 font-mono text-lg">₹</span>
                    <input
                      type="number"
                      value={tempCapital}
                      onChange={e => setTempCapital(e.target.value)}
                      className="bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-white/10 rounded-xl py-2 px-3 w-36 font-mono text-base focus:outline-none focus:border-blue-500/50 transition-colors text-zinc-900 dark:text-zinc-100"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveCapital()}
                    />
                    <button onClick={handleSaveCapital} className="p-2.5 bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-500 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-600/30 transition-colors">
                      <Check size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 group">
                    <h2 className="text-2xl font-mono tracking-tight text-zinc-900 dark:text-zinc-50">₹{capital.toLocaleString('en-IN')}</h2>
                    <button
                      onClick={() => { setTempCapital(capital.toString()); setIsEditingCapital(true); }}
                      className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-300 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              <div className="w-12 h-12 bg-zinc-50 dark:bg-white/5 rounded-full flex items-center justify-center border border-zinc-100 dark:border-white/5">
                <Calculator className="text-zinc-400 dark:text-zinc-400" size={20} />
              </div>
            </div>

            {/* Calculator Form */}
            <div className="bg-white dark:bg-[#121214] rounded-[2rem] p-6 sm:p-7 border border-zinc-200 dark:border-white/5 shadow-2xl">
              <div className="space-y-6">
                {/* Risk & Leverage Row */}
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <div className="flex items-center justify-between mb-2 relative" ref={dropdownRef}>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest">Risk (₹)</label>
                      <button
                        onClick={() => {
                          setShowDropdown(!showDropdown);
                          if (showDropdown) setShowAddPreset(false);
                        }}
                        className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors bg-zinc-100 dark:bg-white/5 px-2 py-1 rounded-md border border-zinc-200 dark:border-white/5"
                      >
                        Presets <ChevronDown size={12} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {showDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -5, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                          >
                            {showAddPreset ? (
                              <div className="p-3 space-y-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">New Preset</span>
                                  <button onClick={() => setShowAddPreset(false)} className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300">
                                    <X size={14} />
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  <input 
                                    type="text" 
                                    placeholder="Name (e.g. Max)" 
                                    value={newPresetName}
                                    onChange={e => setNewPresetName(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-blue-500/50 text-zinc-900 dark:text-zinc-200"
                                    autoFocus
                                  />
                                  <div className="relative">
                                    <input 
                                      type="number" 
                                      placeholder="Percentage" 
                                      value={newPresetPct}
                                      onChange={e => setNewPresetPct(e.target.value)}
                                      className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-white/10 rounded-lg py-2 pl-3 pr-8 text-sm font-mono focus:outline-none focus:border-blue-500/50 text-zinc-900 dark:text-zinc-200"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 text-sm">%</span>
                                  </div>
                                  <button 
                                    onClick={handleSavePreset}
                                    disabled={!newPresetName || !newPresetPct}
                                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-100 dark:disabled:bg-white/5 disabled:text-zinc-400 dark:disabled:text-zinc-500 text-white rounded-lg py-2 text-sm font-medium transition-all"
                                  >
                                    Save Preset
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="p-1.5">
                                {presets.map(preset => (
                                  <div key={preset.id} className="group flex items-center justify-between px-3 py-2 hover:bg-zinc-50 dark:hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                                    onClick={() => {
                                      if (capital) {
                                        setRiskAmount((capital * (preset.percentage / 100)).toString());
                                        setShowDropdown(false);
                                      }
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-zinc-700 dark:text-zinc-300">{preset.name}</span>
                                      <span className="text-xs font-mono text-blue-600 dark:text-blue-400/70">{preset.percentage}%</span>
                                    </div>
                                    {!DEFAULT_PRESETS.find(p => p.id === preset.id) && (
                                      <button 
                                        onClick={(e) => handleDeletePreset(preset.id, e)}
                                        className="opacity-0 group-hover:opacity-100 text-zinc-400 dark:text-zinc-500 hover:text-rose-500 dark:hover:text-rose-400 transition-all p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                      >
                                        <X size={14} />
                                      </button>
                                    )}
                                  </div>
                                ))}
                                <div className="h-px bg-zinc-100 dark:bg-white/5 my-1.5 mx-1" />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowAddPreset(true);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-white/5 rounded-lg text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                                >
                                  <Plus size={14} />
                                  <span>Add Custom Preset</span>
                                </button>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <input
                      type="number"
                      value={riskAmount}
                      onChange={e => setRiskAmount(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-white/10 rounded-2xl py-3.5 px-4 font-mono text-base focus:outline-none focus:border-blue-500/50 transition-colors text-zinc-900 dark:text-zinc-100"
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Leverage (x)</label>
                    <input
                      type="number"
                      value={leverage}
                      onChange={e => setLeverage(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-white/10 rounded-2xl py-3.5 px-4 font-mono text-base focus:outline-none focus:border-blue-500/50 transition-colors text-zinc-900 dark:text-zinc-100"
                      placeholder="10"
                    />
                  </div>
                </div>

                {/* Entry & SL Row */}
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Entry Price</label>
                    <input
                      type="number"
                      value={entryPrice}
                      onChange={e => setEntryPrice(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-white/10 rounded-2xl py-3.5 px-4 font-mono text-base focus:outline-none focus:border-blue-500/50 transition-colors text-zinc-900 dark:text-zinc-100"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Stop Loss</label>
                    <input
                      type="number"
                      value={slPrice}
                      onChange={e => setSlPrice(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-white/10 rounded-2xl py-3.5 px-4 font-mono text-base focus:outline-none focus:border-blue-500/50 transition-colors text-zinc-900 dark:text-zinc-100"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Risk:Reward Section */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest">Risk : Reward</label>
                    {isValid && currentRR > 0 && (
                      <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/10 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-400/20">
                        Target: ₹{targetPrice.toLocaleString('en-IN', { maximumFractionDigits: 4 })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5">
                    {[2, 3, 4, 5].map(ratio => (
                      <button
                        key={ratio}
                        onClick={() => { setActiveRR(ratio); setCustomRR(''); }}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-mono transition-colors border ${
                          activeRR === ratio && !customRR
                            ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30'
                            : 'bg-zinc-50 dark:bg-[#09090b] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5'
                        }`}
                      >
                        1:{ratio}
                      </button>
                    ))}
                    <div className="relative flex-[1.5]">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 text-sm font-mono">1:</span>
                      <input
                        type="number"
                        value={customRR}
                        onChange={e => setCustomRR(e.target.value)}
                        className={`w-full bg-zinc-50 dark:bg-[#09090b] border ${
                          customRR
                            ? 'border-blue-300 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/5'
                            : 'border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400'
                        } rounded-xl py-2.5 pl-9 pr-3 text-sm font-mono focus:outline-none focus:border-blue-500/50 transition-colors`}
                        placeholder="Custom"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Results Section */}
              <div className="mt-8 pt-7 border-t border-zinc-200 dark:border-white/5">
                <AnimatePresence mode="wait">
                  {isValid ? (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-zinc-500">Trade Direction</span>
                        <span className={`flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-lg ${isLong ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-200 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500 border border-rose-200 dark:border-rose-500/20'}`}>
                          {isLong ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {isLong ? 'Long' : 'Short'}
                        </span>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-[2rem] p-7 text-center relative overflow-hidden shadow-sm">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 dark:via-blue-500/50 to-transparent"></div>
                        <p className="text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-widest mb-3">Punch Amount (Margin)</p>
                        <p className="text-5xl font-light text-blue-950 dark:text-blue-50 font-mono tracking-tight">
                          <span className="text-blue-400 dark:text-blue-500/50 mr-1">₹</span>
                          {marginRequired.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="bg-zinc-50 dark:bg-[#09090b] rounded-2xl p-4 text-center border border-zinc-200 dark:border-white/5">
                          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-widest mb-2">Quantity</p>
                          <p className="text-sm font-mono text-zinc-800 dark:text-zinc-300">{quantity.toLocaleString('en-IN', { maximumFractionDigits: 4 })}</p>
                        </div>
                        <div className="bg-zinc-50 dark:bg-[#09090b] rounded-2xl p-4 text-center border border-zinc-200 dark:border-white/5">
                          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-widest mb-2">Position Size</p>
                          <p className="text-sm font-mono text-zinc-800 dark:text-zinc-300">₹{positionSize.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                        </div>
                        <div className="bg-zinc-50 dark:bg-[#09090b] rounded-2xl p-4 text-center border border-zinc-200 dark:border-white/5">
                          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-widest mb-2">Risk ({riskPercentage.toFixed(2)}%)</p>
                          <p className={`text-sm font-mono ${riskPercentage > 5 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-zinc-800 dark:text-zinc-300'}`}>
                            ₹{r.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </p>
                        </div>
                        <div className="bg-zinc-50 dark:bg-[#09090b] rounded-2xl p-4 text-center border border-zinc-200 dark:border-white/5">
                          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-widest mb-2">Reward</p>
                          <p className="text-sm font-mono text-emerald-600 dark:text-emerald-400 font-semibold">₹{potentialProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                        </div>
                      </div>

                      {riskPercentage > 5 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="flex items-start gap-3 mt-5 text-xs text-rose-700 dark:text-rose-400/90 bg-rose-50 dark:bg-rose-500/10 p-4 rounded-xl border border-rose-200 dark:border-rose-500/20"
                        >
                          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                          <p className="leading-relaxed">High risk! You are risking more than 5% of your capital on a single trade.</p>
                        </motion.div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-10 text-zinc-500 dark:text-zinc-600 flex flex-col items-center"
                    >
                      <div className="w-14 h-14 rounded-full border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-[#09090b] flex items-center justify-center mb-5">
                        <span className="text-zinc-400 dark:text-zinc-700 font-mono text-xl">/</span>
                      </div>
                      <p className="text-sm tracking-wide">Enter trade details to calculate</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
