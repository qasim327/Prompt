import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Eye,
  Heart,
  Share2,
  Calendar,
  User,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PromptItem, PlatformName } from '../types';
import { PLATFORM_CONFIGS } from '../utils/platforms';
import { incrementCopyCount, incrementLikeCount, incrementViewCount } from '../services/promptService';
import { fireCopyConfetti } from '../utils/confetti';

interface PromptModalProps {
  prompt: PromptItem | null;
  onClose: () => void;
  onSelectRelated: (prompt: PromptItem) => void;
  allPrompts: PromptItem[];
}

export const PromptModal: React.FC<PromptModalProps> = ({
  prompt,
  onClose,
  onSelectRelated,
  allPrompts,
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedNegative, setCopiedNegative] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [copiesCount, setCopiesCount] = useState(0);

  useEffect(() => {
    if (prompt) {
      setLikesCount(prompt.likes || 0);
      setCopiesCount(prompt.copyCount || 0);
      setLiked(false);
      setCopiedPrompt(false);
      setCopiedNegative(false);

      // TRIGGER on modal open: increment views count in Firestore
      incrementViewCount(prompt.id);
    }
  }, [prompt?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!prompt) return null;

  // Copy Main Prompt
  const handleCopyPrompt = async (e: React.MouseEvent) => {
    try {
      await navigator.clipboard.writeText(prompt.promptText);
      setCopiedPrompt(true);
      setCopiesCount((prev) => prev + 1);
      fireCopyConfetti(e);
      toast.success('Prompt Copied to Clipboard!');
      incrementCopyCount(prompt.id);
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  // Copy Negative Prompt
  const handleCopyNegative = async () => {
    if (!prompt.negativePrompt) return;
    try {
      await navigator.clipboard.writeText(prompt.negativePrompt);
      setCopiedNegative(true);
      toast.success('Negative prompt copied!');
      setTimeout(() => setCopiedNegative(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  // Try on platform
  const handleLaunchPlatform = async (platform: PlatformName, url: string, e: React.MouseEvent) => {
    try {
      await navigator.clipboard.writeText(prompt.promptText);
      fireCopyConfetti(e);
      setCopiesCount((prev) => prev + 1);
      incrementCopyCount(prompt.id);
      toast.success(`Prompt copied! Opening ${platform}...`, { icon: '🚀' });
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Like prompt
  const handleLike = () => {
    if (liked) return;
    setLiked(true);
    setLikesCount((prev) => prev + 1);
    toast.success('Added to your favorites!');
    incrementLikeCount(prompt.id);
  };

  // Share
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: prompt.title,
          text: `Check out this AI prompt: "${prompt.title}" on PromptVault!`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (err) {
      // Ignored if cancelled
    }
  };

  // Related prompts: same category or matching tags
  const relatedPrompts = allPrompts
    .filter((p) => p.id !== prompt.id && (p.category === prompt.category || p.platform.some((plat) => prompt.platform.includes(plat))))
    .slice(0, 4);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/70 backdrop-blur-md">
        {/* Click outside backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-5xl max-h-[92vh] bg-white dark:bg-[#141618] rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col z-10"
        >
          {/* Header Close & Share bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                {prompt.category}
              </span>
              <span className="text-xs text-zinc-400 flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                <span>{prompt.createdBy}</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Share link"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body - Scrollable */}
          <div className="overflow-y-auto p-6 md:p-8 flex-1 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Side: Large Image */}
              <div className="lg:col-span-5 space-y-3">
                <div className="rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/60 shadow-inner group relative">
                  <img
                    src={prompt.imageUrl}
                    alt={prompt.title}
                    className="w-full h-auto max-h-[500px] object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <a
                      href={prompt.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-white bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-1.5 hover:bg-black/80"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View full size original</span>
                    </a>
                  </div>
                </div>

                {/* Left Stats Bar */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-xs">
                  <div className="flex items-center gap-4 text-zinc-600 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Eye className="w-4 h-4 text-blue-500" />
                      <span>{prompt.views + 1} views</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <Copy className="w-4 h-4 text-amber-500" />
                      <span>{copiesCount} copies</span>
                    </span>
                  </div>

                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-semibold transition-all cursor-pointer ${
                      liked
                        ? 'bg-rose-500 text-white'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-rose-100 hover:text-rose-600'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
                    <span>{likesCount}</span>
                  </button>
                </div>
              </div>

              {/* Right Side: Details & Prompts */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-zinc-900 dark:text-white leading-tight">
                    {prompt.title}
                  </h2>
                </div>

                {/* Main Prompt Box */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs uppercase font-bold tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Prompt</span>
                    </label>
                    <span className="text-[11px] text-zinc-400">
                      {prompt.promptText.length} characters
                    </span>
                  </div>

                  <div className="relative group p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 select-text font-mono text-[13px]">
                    <p className="whitespace-pre-wrap">{prompt.promptText}</p>
                  </div>

                  {/* Big Copy Prompt Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCopyPrompt}
                    className={`w-full py-3.5 px-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                      copiedPrompt
                        ? 'bg-emerald-600 text-white shadow-emerald-500/30'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 shadow-zinc-900/20'
                    }`}
                  >
                    {copiedPrompt ? (
                      <>
                        <Check className="w-5 h-5 text-white" />
                        <span>Copied Prompt to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5 text-amber-400 dark:text-amber-600" />
                        <span>Copy Full Prompt</span>
                      </>
                    )}
                  </motion.button>
                </div>

                {/* Negative Prompt (if available) */}
                {prompt.negativePrompt && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs uppercase font-bold tracking-wider text-rose-500 flex items-center gap-1.5">
                        <span>Negative Prompt</span>
                      </label>
                      <button
                        onClick={handleCopyNegative}
                        className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedNegative ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedNegative ? 'Copied' : 'Copy Negative'}</span>
                      </button>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 text-xs font-mono text-zinc-700 dark:text-zinc-300">
                      {prompt.negativePrompt}
                    </div>
                  </div>
                )}

                {/* Compatible Platforms */}
                <div className="space-y-2 pt-1">
                  <label className="text-xs uppercase font-bold tracking-wider text-zinc-500 dark:text-zinc-400">
                    Optimized For Platforms
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {prompt.platform?.map((plat) => {
                      const cfg = PLATFORM_CONFIGS[plat as PlatformName];
                      return (
                        <span
                          key={plat}
                          className={`px-3 py-1 rounded-xl text-xs font-semibold border flex items-center gap-1.5 ${
                            cfg?.badgeClass || 'bg-zinc-100 dark:bg-zinc-800'
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: cfg?.color || '#999' }}
                          />
                          {plat}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Big Try On Buttons Row */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs uppercase font-bold tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                    <span>Try This Prompt Directly On AI Tools</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {(['ChatGPT', 'Gemini', 'Leonardo AI', 'Midjourney', 'Flux', 'Ideogram'] as PlatformName[]).map((plat) => {
                      const cfg = PLATFORM_CONFIGS[plat];
                      return (
                        <button
                          key={plat}
                          onClick={(e) => handleLaunchPlatform(plat, cfg.url, e)}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all text-xs font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer shadow-xs"
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: cfg.color }}
                            />
                            <span>{plat}</span>
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Related Prompts Row */}
            {relatedPrompts.length > 0 && (
              <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
                <h4 className="font-heading font-bold text-lg text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <span>Related Curated Prompts</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {relatedPrompts.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => onSelectRelated(rel)}
                      className="group cursor-pointer rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:shadow-md transition-all flex flex-col"
                    >
                      <div className="h-28 overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                        <img
                          src={rel.imageUrl}
                          alt={rel.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="p-2.5 flex-1 flex flex-col justify-between">
                        <p className="text-xs font-bold text-zinc-900 dark:text-white line-clamp-1 group-hover:text-amber-500">
                          {rel.title}
                        </p>
                        <span className="text-[10px] text-zinc-400 mt-1">
                          {rel.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
