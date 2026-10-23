import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  X,
  Sun,
  Moon,
  PlusCircle,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  LogIn,
  ChevronDown,
  Layers,
  Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { CategoryItem, PlatformName, SiteSettings } from '../types';
import { ALL_PLATFORMS, PLATFORM_CONFIGS } from '../utils/platforms';

interface NavbarProps {
  categories: CategoryItem[];
  selectedCategory: string;
  onSelectCategory: (catSlug: string) => void;
  selectedPlatform: string;
  onSelectPlatform: (platform: string) => void;
  searchTerm: string;
  onSearchChange: (query: string) => void;
  activeView: 'home' | 'dashboard' | 'admin';
  onChangeView: (view: 'home' | 'dashboard' | 'admin') => void;
  onOpenAddPrompt: () => void;
  onOpenAuth: () => void;
  siteSettings?: SiteSettings;
}

export const Navbar: React.FC<NavbarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  selectedPlatform,
  onSelectPlatform,
  searchTerm,
  onSearchChange,
  activeView,
  onChangeView,
  onOpenAddPrompt,
  onOpenAuth,
  siteSettings,
}) => {
  const { currentUser, userProfile, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <>
      {/* Top Announcement Bar if configured in Admin */}
      {siteSettings?.announcementEnabled && siteSettings.announcementText && (
        <div className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 py-1.5 px-4 text-center text-xs font-semibold text-white shadow-xs">
          <span>{siteSettings.announcementText}</span>
        </div>
      )}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/80 dark:bg-[#0c0d0e]/80 border-b border-zinc-200/80 dark:border-zinc-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Navbar Row */}
        <div className="flex items-center justify-between h-18 gap-4">
          {/* Logo */}
          <button
            onClick={() => onChangeView('home')}
            className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="font-heading font-extrabold text-xl tracking-tight text-zinc-900 dark:text-white flex items-center gap-1">
                Prompt<span className="text-amber-500">Vault</span>
              </span>
              <span className="hidden sm:block text-[10px] uppercase font-bold tracking-widest text-zinc-400 dark:text-zinc-500 -mt-1">
                AI Prompt Library
              </span>
            </div>
          </button>

          {/* Center Search Bar */}
          <div className="flex-1 max-w-xl mx-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search prompts, styles, keywords (e.g. cyberpunk, portrait)..."
                className="w-full pl-10 pr-9 py-2 rounded-xl text-sm bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 border border-transparent focus:border-amber-500/50 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none transition-all shadow-inner"
              />
              {searchTerm && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5">
            {/* Submit Prompt Button */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={currentUser ? onOpenAddPrompt : onOpenAuth}
              className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 shadow-sm transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-amber-400 dark:text-amber-600" />
              <span>Submit Prompt</span>
            </motion.button>

            {/* Dark / Light Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2 rounded-xl text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-zinc-700" />}
            </motion.button>

            {/* Navigation / User Controls */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white text-xs font-bold uppercase ring-2 ring-amber-400/30">
                    {currentUser.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt="Avatar"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      currentUser.displayName?.[0] || currentUser.email?.[0] || 'U'
                    )}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 hidden sm:block" />
                </button>

                <AnimatePresence>
                  {showUserDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl py-2 z-50 overflow-hidden"
                    >
                      <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800">
                        <p className="text-xs text-zinc-400">Signed in as</p>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                          {currentUser.displayName || currentUser.email?.split('@')[0]}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">{currentUser.email}</p>
                        {isAdmin && (
                          <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Super Admin</span>
                          </div>
                        )}
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            onChangeView('home');
                            setShowUserDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${
                            activeView === 'home' ? 'text-amber-500 font-semibold' : 'text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          <Layers className="w-4 h-4" />
                          <span>Browse Library</span>
                        </button>

                        <button
                          onClick={() => {
                            onChangeView('dashboard');
                            setShowUserDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${
                            activeView === 'dashboard' ? 'text-amber-500 font-semibold' : 'text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          <span>My Dashboard</span>
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => {
                              onChangeView('admin');
                              setShowUserDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors ${
                              activeView === 'admin' ? 'text-amber-500 font-semibold' : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Admin Portal</span>
                          </button>
                        )}
                      </div>

                      <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800">
                        <button
                          onClick={() => {
                            logout();
                            setShowUserDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onOpenAuth}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 shadow-sm transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Filter Bar (Only displayed on Home view) */}
        {activeView === 'home' && (
          <div className="py-2.5 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar border-t border-zinc-100 dark:border-zinc-800/60">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.slug;
                return (
                  <button
                    key={cat.id || cat.slug}
                    onClick={() => onSelectCategory(cat.slug)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {/* Platform Filter Dropdown */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowPlatformDropdown(!showPlatformDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-200 border border-zinc-200/60 dark:border-zinc-800 transition-colors cursor-pointer"
              >
                <Filter className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {selectedPlatform === 'all' ? 'All Platforms' : selectedPlatform}
                </span>
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              <AnimatePresence>
                {showPlatformDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl py-1.5 z-50"
                  >
                    <button
                      onClick={() => {
                        onSelectPlatform('all');
                        setShowPlatformDropdown(false);
                      }}
                      className={`w-full text-left px-3.5 py-1.5 text-xs font-medium flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                        selectedPlatform === 'all' ? 'text-amber-500 font-bold' : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <span>All Platforms</span>
                      {selectedPlatform === 'all' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                    </button>
                    {ALL_PLATFORMS.map((plat) => {
                      const isSel = selectedPlatform === plat;
                      return (
                        <button
                          key={plat}
                          onClick={() => {
                            onSelectPlatform(plat);
                            setShowPlatformDropdown(false);
                          }}
                          className={`w-full text-left px-3.5 py-1.5 text-xs font-medium flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                            isSel ? 'text-amber-500 font-bold' : 'text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: PLATFORM_CONFIGS[plat]?.color || '#999' }}
                            />
                            {plat}
                          </span>
                          {isSel && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </header>
    </>
  );
};
