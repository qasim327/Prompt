/**
 * PromptVault - Modern AI Prompt Library
 * Super Admin: alisahab62525@gmail.com
 */
import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { PromptModal } from './components/PromptModal';
import { AddPromptModal } from './components/AddPromptModal';
import { AuthModal } from './components/AuthModal';
import { Home } from './pages/Home';
import { UserDashboard } from './pages/UserDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { PromptItem, CategoryItem, SiteSettings } from './types';
import { INITIAL_CATEGORIES, INITIAL_PROMPTS } from './data/seedData';
import { seedInitialDataIfNeeded } from './services/promptService';
import { subscribeSiteSettings, DEFAULT_SITE_SETTINGS } from './services/siteSettingsService';

const MainApp: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const [activeView, setActiveView] = useState<'home' | 'dashboard' | 'admin'>('home');

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Collections state with immediate default seed prompts
  const [prompts, setPrompts] = useState<PromptItem[]>(() =>
    INITIAL_PROMPTS.map((p, idx) => ({ id: `seed-${idx}`, ...p }))
  );
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES);
  const [loading, setLoading] = useState<boolean>(false);

  // Live Website CMS settings
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  // Modals state
  const [activeModalPrompt, setActiveModalPrompt] = useState<PromptItem | null>(null);
  const [showAddPromptModal, setShowAddPromptModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Initialize and listen to Firestore collections
  useEffect(() => {
    // Seed database if empty on boot
    seedInitialDataIfNeeded();

    // Subscribe to site CMS settings
    const unsubSettings = subscribeSiteSettings((settings) => {
      setSiteSettings(settings);
    });

    // Listen to prompts collection
    const qPrompts = collection(db, 'prompts');
    const unsubscribePrompts = onSnapshot(
      qPrompts,
      (snapshot) => {
        if (!snapshot.empty) {
          const items: PromptItem[] = [];
          snapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() } as PromptItem);
          });

          // Default sort by copyCount + views or createdAt
          items.sort((a, b) => {
            const scoreB = (b.copyCount || 0) * 2 + (b.views || 0);
            const scoreA = (a.copyCount || 0) * 2 + (a.views || 0);
            return scoreB - scoreA;
          });

          setPrompts(items);
        }
        setLoading(false);
      },
      (error) => {
        console.warn('Prompts listener notification:', error?.message || error);
        setLoading(false);
      }
    );

    // Listen to categories collection
    const unsubscribeCats = onSnapshot(
      collection(db, 'categories'),
      (snapshot) => {
        if (!snapshot.empty) {
          const catItems: CategoryItem[] = [
            { id: 'cat-all', name: 'All', slug: 'all' },
          ];
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.slug !== 'all') {
              catItems.push({ id: doc.id, name: data.name, slug: data.slug });
            }
          });
          setCategories(catItems);
        }
      },
      (error) => {
        console.warn('Categories listener error, keeping defaults:', error);
      }
    );

    return () => {
      unsubSettings();
      unsubscribePrompts();
      unsubscribeCats();
    };
  }, []);

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSelectedPlatform('all');
    setSearchTerm('');
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors selection:bg-amber-400/30 selection:text-black">
      {/* Navbar with Sticky header */}
      <Navbar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedPlatform={selectedPlatform}
        onSelectPlatform={setSelectedPlatform}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        activeView={activeView}
        onChangeView={setActiveView}
        onOpenAddPrompt={() => {
          if (!currentUser) {
            setShowAuthModal(true);
          } else {
            setShowAddPromptModal(true);
          }
        }}
        onOpenAuth={() => setShowAuthModal(true)}
        siteSettings={siteSettings}
      />

      {/* Main View Router */}
      <div className="flex-1">
        {activeView === 'home' && (
          <Home
            prompts={prompts}
            loading={loading}
            selectedCategory={selectedCategory}
            selectedPlatform={selectedPlatform}
            searchTerm={searchTerm}
            siteSettings={siteSettings}
            onClearFilters={handleClearFilters}
            onOpenModal={(p) => setActiveModalPrompt(p)}
            onOpenAddPrompt={() => {
              if (!currentUser) setShowAuthModal(true);
              else setShowAddPromptModal(true);
            }}
          />
        )}

        {activeView === 'dashboard' && (
          <UserDashboard
            onOpenAddPrompt={() => setShowAddPromptModal(true)}
            onOpenPromptModal={(p) => setActiveModalPrompt(p)}
            onGoHome={() => setActiveView('home')}
          />
        )}

        {activeView === 'admin' && (
          <AdminDashboard
            onGoHome={() => setActiveView('home')}
            onOpenPromptModal={(p) => setActiveModalPrompt(p)}
          />
        )}
      </div>

      {/* Clean Footer (No public admin email, only shows Admin Portal if logged in as Admin) */}
      <footer className="border-t border-zinc-200/80 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-heading font-extrabold text-sm text-zinc-900 dark:text-white">
              Prompt<span className="text-amber-500">Vault</span>
            </span>
            <span>— The Premier Curated AI Prompt & Visuals Library</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setActiveView('home')}
              className="hover:text-zinc-900 dark:hover:text-white cursor-pointer"
            >
              Explore
            </button>
            <span>•</span>
            <button
              onClick={() => {
                if (!currentUser) setShowAuthModal(true);
                else setActiveView('dashboard');
              }}
              className="hover:text-zinc-900 dark:hover:text-white cursor-pointer"
            >
              My Dashboard
            </button>
            {/* Admin Portal link only shown to alisahab62525@gmail.com */}
            {isAdmin && (
              <>
                <span>•</span>
                <button
                  onClick={() => setActiveView('admin')}
                  className="text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                >
                  Admin Portal
                </button>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PromptModal
        prompt={activeModalPrompt}
        onClose={() => setActiveModalPrompt(null)}
        onSelectRelated={(p) => setActiveModalPrompt(p)}
        allPrompts={prompts.filter((p) => p.status === 'approved')}
      />

      <AddPromptModal
        isOpen={showAddPromptModal}
        onClose={() => setShowAddPromptModal(false)}
        categories={categories}
        onOpenAuth={() => setShowAuthModal(true)}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* React Hot Toast with custom styling */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'dark:bg-zinc-900 dark:text-white dark:border dark:border-zinc-800 text-xs font-semibold shadow-xl rounded-2xl',
          duration: 3000,
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
