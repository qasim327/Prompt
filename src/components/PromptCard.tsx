import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  Eye,
  Heart,
  Sparkles,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PromptItem, PlatformName } from '../types';
import { PLATFORM_CONFIGS } from '../utils/platforms';
import { incrementCopyCount, incrementLikeCount } from '../services/promptService';
import { fireCopyConfetti } from '../utils/confetti';

interface PromptCardProps {
  prompt: PromptItem;
  onOpenModal: (prompt: PromptItem) => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({ prompt, onOpenModal }) => {
  const [copied, setCopied] = useState(false);
  const [showTryDropdown, setShowTryDropdown] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(prompt.likes || 0);
  const [localCopies, setLocalCopies] = useState(prompt.copyCount || 0);

  // Copy Prompt handler
  const handleCopyPrompt = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(prompt.promptText);
      setCopied(true);
      setLocalCopies((prev) => prev + 1);
      fireCopyConfetti(e);
      toast.success('Prompt Copied to Clipboard!');
      incrementCopyCount(prompt.id);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      toast.error('Failed to copy prompt');
    }
  };

  // Try On Platform handler
  const handleTryOn = async (
    e: React.MouseEvent,
    platform: PlatformName,
    url: string
  ) => {
    e.stopPropagation();
    setShowTryDropdown(false);
    try {
      await navigator.clipboard.writeText(prompt.promptText);
      fireCopyConfetti(e);
      toast.success(`Prompt copied! Opening ${platform}...`, {
        icon: '🚀',
      });
      incrementCopyCount(prompt.id);
      setLocalCopies((prev) => prev + 1);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Like handler
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (liked) return;
    setLiked(true);
    setLocalLikes((prev) => prev + 1);
    toast.success('Liked prompt!');
    incrementLikeCount(prompt.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="masonry-item group relative rounded-2xl bg-white dark:bg-[#141618] border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-black/50 transition-all duration-300 overflow-hidden flex flex-col"
    >
      {/* Top: Image Section with Shimmer Loader */}
      <div
        onClick={() => onOpenModal(prompt)}
        className="relative overflow-hidden cursor-pointer bg-zinc-100 dark:bg-zinc-800"
      >
        {!imageLoaded && (
          <div className="w-full h-56 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800 animate-pulse flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-zinc-300 dark:text-zinc-600" />
          </div>
        )}
        <img
          src={prompt.imageUrl}
          alt={prompt.title}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${
            imageLoaded ? 'block' : 'hidden'
          }`}
          style={{ maxHeight: '420px', minHeight: '180px' }}
        />

        {/* Category Floating Pill */}
        <div className="absolute top-3 left-3 pointer-events-none">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/60 backdrop-blur-md text-white border border-white/10 shadow-sm">
            {prompt.category}
          </span>
        </div>

        {/* Like Floating Button */}
        <button
          onClick={handleLike}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all shadow-sm cursor-pointer ${
            liked
              ? 'bg-rose-500 text-white shadow-rose-500/30'
              : 'bg-black/50 text-white/80 hover:text-white hover:bg-black/70'
          }`}
          title="Like prompt"
        >
          <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Middle: Content Section */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Title */}
        <h3
          onClick={() => onOpenModal(prompt)}
          className="font-heading font-bold text-base text-zinc-900 dark:text-white leading-snug hover:text-amber-500 dark:hover:text-amber-400 transition-colors cursor-pointer line-clamp-1"
        >
          {prompt.title}
        </h3>

        {/* Prompt Text (2-line truncated with Show More) */}
        <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
          <p className={isExpanded ? '' : 'line-clamp-2'}>
            "{prompt.promptText}"
          </p>
          {prompt.promptText.length > 90 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="mt-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>

        {/* Platform Badges */}
        <div className="mt-3 flex flex-wrap gap-1.5 items-center">
          {prompt.platform?.map((plat) => {
            const config = PLATFORM_CONFIGS[plat as PlatformName];
            return (
              <span
                key={plat}
                className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                  config?.badgeClass || 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                }`}
              >
                {plat}
              </span>
            );
          })}
        </div>

        {/* Stats Row */}
        <div className="mt-3.5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1" title="Views">
              <Eye className="w-3.5 h-3.5" />
              <span>{prompt.views || 0}</span>
            </span>
            <span className="flex items-center gap-1" title="Copies">
              <Copy className="w-3.5 h-3.5" />
              <span>{localCopies}</span>
            </span>
            <span className="flex items-center gap-1" title="Likes">
              <Heart className="w-3.5 h-3.5" />
              <span>{localLikes}</span>
            </span>
          </div>
          <span className="text-[10px] text-zinc-400 truncate max-w-[90px]">
            {prompt.createdBy?.split('@')[0] || 'Curator'}
          </span>
        </div>

        {/* Bottom Action Row */}
        <div className="mt-3.5 flex items-center gap-2 pt-1 relative">
          {/* Button 1: Copy Prompt */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleCopyPrompt}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Prompt</span>
              </>
            )}
          </motion.button>

          {/* Button 2: Try On Dropdown */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowTryDropdown(!showTryDropdown);
              }}
              className="flex items-center gap-1 py-2 px-3 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
            >
              <span>Try On</span>
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showTryDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 bottom-full mb-2 w-48 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl py-1.5 z-50 overflow-hidden"
                >
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
                    Launch With Prompt
                  </div>
                  {(['ChatGPT', 'Gemini', 'Leonardo AI', 'Midjourney', 'Flux', 'Ideogram'] as PlatformName[]).map((plat) => {
                    const cfg = PLATFORM_CONFIGS[plat];
                    return (
                      <button
                        key={plat}
                        onClick={(e) => handleTryOn(e, plat, cfg.url)}
                        className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: cfg.color }}
                          />
                          <span>{plat}</span>
                        </span>
                        <ExternalLink className="w-3 h-3 text-zinc-400" />
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
