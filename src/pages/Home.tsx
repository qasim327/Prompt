import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, SearchX, Filter, PlusCircle } from 'lucide-react';
import { PromptItem, SiteSettings } from '../types';
import { PromptCard } from '../components/PromptCard';

interface HomeProps {
  prompts: PromptItem[];
  loading: boolean;
  selectedCategory: string;
  selectedPlatform: string;
  searchTerm: string;
  siteSettings?: SiteSettings;
  onClearFilters: () => void;
  onOpenModal: (prompt: PromptItem) => void;
  onOpenAddPrompt: () => void;
}

export const Home: React.FC<HomeProps> = ({
  prompts,
  loading,
  selectedCategory,
  selectedPlatform,
  searchTerm,
  siteSettings,
  onClearFilters,
  onOpenModal,
  onOpenAddPrompt,
}) => {
  // Filter logic: real-time search filtering by title and promptText
  const filteredPrompts = prompts.filter((item) => {
    // Must be approved for public display
    if (item.status !== 'approved') return false;

    // Category filter
    if (selectedCategory && selectedCategory !== 'all') {
      const matchCat =
        item.category.toLowerCase().replace(/[^a-z0-9]/g, '') ===
        selectedCategory.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!matchCat) return false;
    }

    // Platform filter
    if (selectedPlatform && selectedPlatform !== 'all') {
      const hasPlat = item.platform?.some(
        (p) => p.toLowerCase() === selectedPlatform.toLowerCase()
      );
      if (!hasPlat) return false;
    }

    // Search term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const inTitle = item.title?.toLowerCase().includes(q);
      const inPrompt = item.promptText?.toLowerCase().includes(q);
      const inCategory = item.category?.toLowerCase().includes(q);
      if (!inTitle && !inPrompt && !inCategory) return false;
    }

    return true;
  });

  return (
    <div className="relative min-h-screen">
      {/* Background Subtle Gradient Blobs */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-400/10 dark:bg-amber-600/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] bg-rose-400/10 dark:bg-rose-600/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 w-[28rem] h-[28rem] bg-indigo-400/10 dark:bg-indigo-600/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20">
        {/* Hero Section */}
        <div className="mb-8 text-center max-w-3xl mx-auto space-y-3">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{siteSettings?.heroBadge || 'Discover Curated AI Art & Prompts'}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight text-zinc-900 dark:text-white"
          >
            {siteSettings?.heroHeadline || 'Supercharge Your AI Visuals with'}{' '}
            <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">
              {siteSettings?.heroHeadlineHighlight || 'One-Click Prompts'}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed"
          >
            {siteSettings?.heroSubtitle ||
              'Explore high-quality image prompts designed for ChatGPT, Gemini, Leonardo AI, Midjourney, and Flux. Copy instantly or launch directly into your favorite generator.'}
          </motion.p>
        </div>

        {/* Filter Summary indicator */}
        {(selectedCategory !== 'all' || selectedPlatform !== 'all' || searchTerm) && (
          <div className="mb-6 flex items-center justify-between p-3 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800 text-xs">
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
              <Filter className="w-3.5 h-3.5 text-amber-500" />
              <span>
                Showing <strong className="text-zinc-900 dark:text-white">{filteredPrompts.length}</strong> prompts
                {selectedCategory !== 'all' && ` in ${selectedCategory}`}
                {selectedPlatform !== 'all' && ` for ${selectedPlatform}`}
                {searchTerm && ` matching "${searchTerm}"`}
              </span>
            </div>
            <button
              onClick={onClearFilters}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="masonry-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="masonry-item rounded-2xl bg-white dark:bg-[#141618] border border-zinc-200/80 dark:border-zinc-800 p-4 space-y-3 animate-pulse"
              >
                <div
                  className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-xl"
                  style={{ height: `${180 + (i % 3) * 60}px` }}
                />
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
                <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
                <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
                <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-xl mt-4" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredPrompts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 px-4 max-w-md mx-auto"
          >
            <div className="w-16 h-16 mx-auto rounded-3xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mb-4">
              <SearchX className="w-8 h-8" />
            </div>
            <h3 className="font-heading font-bold text-xl text-zinc-900 dark:text-white mb-1">
              No matching prompts found
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
              We couldn't find any approved prompts matching your current search or filters. Try adjusting your query or submit one yourself!
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={onClearFilters}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
              <button
                onClick={onOpenAddPrompt}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
                <span>Submit Prompt</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Masonry Grid with Pinterest style (1 col mobile, 2 tablet, 4 desktop) */}
        {!loading && filteredPrompts.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.08,
                },
              },
            }}
            className="masonry-grid"
          >
            <AnimatePresence>
              {filteredPrompts.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  onOpenModal={onOpenModal}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};
