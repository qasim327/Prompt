import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  UploadCloud,
  CheckCircle2,
  Image as ImageIcon,
  Sparkles,
  Link as LinkIcon,
  AlertCircle,
  FileText,
  LogIn,
} from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { CategoryItem, PlatformName } from '../types';
import { ALL_PLATFORMS, PLATFORM_CONFIGS } from '../utils/platforms';
import { submitPrompt } from '../services/promptService';
import { uploadPromptImage } from '../utils/imageUpload';
import toast from 'react-hot-toast';

interface AddPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  onPromptSubmitted?: () => void;
  onOpenAuth?: () => void;
}

export const AddPromptModal: React.FC<AddPromptModalProps> = ({
  isOpen,
  onClose,
  categories,
  onPromptSubmitted,
  onOpenAuth,
}) => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [promptText, setPromptText] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [category, setCategory] = useState(categories[1]?.name || 'Photorealistic');
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformName[]>([
    'Midjourney',
    'Leonardo AI',
  ]);
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'file' | 'url'>('file');

  if (!isOpen) return null;

  // Toggle platform checkbox
  const togglePlatform = (plat: PlatformName) => {
    setSelectedPlatforms((prev) =>
      prev.includes(plat) ? prev.filter((p) => p !== plat) : [...prev, plat]
    );
  };

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        toast.error('Image must be under 15MB');
        return;
      }
      setImageFile(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
      setImageUrl('');
    }
  };

  // Drag and drop handler
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setImageUrl('');
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('Please sign in to submit a prompt');
      return;
    }
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!promptText.trim()) {
      toast.error('Main Prompt text is required');
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error('Please select at least one AI platform');
      return;
    }

    let finalImageUrl = imageUrl.trim();

    // If file is selected, upload with real-time progress and guaranteed fallback
    if (imageFile) {
      setIsUploading(true);
      try {
        finalImageUrl = await uploadPromptImage(
          imageFile,
          currentUser.uid,
          (progress) => setUploadProgress(progress)
        );
      } catch (err) {
        console.error('File upload fallback:', err);
      } finally {
        setIsUploading(false);
      }
    }

    if (!finalImageUrl) {
      toast.error('Please upload an image or provide an image URL');
      return;
    }

    try {
      await submitPrompt({
        title,
        promptText,
        negativePrompt,
        imageUrl: finalImageUrl,
        platform: selectedPlatforms,
        category: category || 'Photorealistic',
        userEmail: currentUser.email || 'Anonymous',
        uid: currentUser.uid,
      });

      toast.success('Your prompt sent for admin approval - pending', {
        icon: '✨',
        duration: 4000,
      });

      // Reset form
      setTitle('');
      setPromptText('');
      setNegativePrompt('');
      setImageFile(null);
      setImagePreview(null);
      setImageUrl('');
      setUploadProgress(0);

      if (onPromptSubmitted) onPromptSubmitted();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit prompt');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#141618] rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 z-10 max-h-[92vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* If user is not signed in, show Sign In Required screen before publishing */}
          {!currentUser ? (
            <div className="text-center py-10 px-4 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <LogIn className="w-7 h-7" />
              </div>
              <h3 className="font-heading font-extrabold text-2xl text-zinc-900 dark:text-white">
                Sign In Required to Publish
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                Please sign in or create a creator account before publishing your prompts with images. Your submissions and metrics will be saved to your profile.
              </p>
              <div className="pt-3 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenAuth) onOpenAuth();
                  }}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md hover:opacity-90 flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Sign In / Create Account</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Prompt Submission</span>
                </div>
                <h3 className="font-heading font-extrabold text-2xl text-zinc-900 dark:text-white">
                  Submit Your AI Prompt
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Share your generated image and prompt. Submissions undergo fast review before being published.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Image Upload / URL Tabs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Image Preview <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setUploadType('file')}
                    className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                      uploadType === 'file'
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadType('url')}
                    className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                      uploadType === 'url'
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    Image URL
                  </button>
                </div>
              </div>

              {uploadType === 'file' ? (
                <div>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="relative border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-amber-500 dark:hover:border-amber-400 rounded-2xl p-6 text-center transition-colors bg-zinc-50/50 dark:bg-zinc-900/50 cursor-pointer overflow-hidden"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />

                    {imagePreview ? (
                      <div className="relative inline-block group">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-44 mx-auto rounded-xl object-contain shadow-md"
                        />
                        <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                          Click or drag to change
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-400">
                          <span className="font-semibold text-amber-600 dark:text-amber-400">
                            Click to upload
                          </span>{' '}
                          or drag & drop
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          PNG, JPG, WEBP up to 15MB
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Upload Progress Bar Animation */}
                  {isUploading && (
                    <div className="mt-3 space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                        <span>Uploading image to vault...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-amber-500 to-rose-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ duration: 0.2 }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                      <LinkIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setImagePreview(e.target.value);
                      }}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  {imageUrl && (
                    <div className="mt-2 text-center">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="h-32 mx-auto rounded-xl object-contain border border-zinc-200 dark:border-zinc-700"
                        onError={() => toast.error('Could not load image from URL')}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Prompt Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cyberpunk Neon Ronin in Rain"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* 3. Main Prompt Text (5 rows required) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Main Prompt Text (5 rows) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={5}
                required
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Enter the full, exact prompt you used (lighting, style, camera angle, quality descriptors)..."
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500 leading-relaxed font-mono text-xs"
              />
            </div>

            {/* 4. Negative Prompt (optional) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
                <span>Negative Prompt (Optional)</span>
                <span className="text-[11px] text-zinc-400 font-normal">What to avoid</span>
              </label>
              <textarea
                rows={2}
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="e.g. blurry, low quality, oversaturated, deformed hands, extra limbs, watermark"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500 leading-relaxed font-mono text-xs"
              />
            </div>

            {/* 5. Category Select */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {categories
                  .filter((c) => c.slug !== 'all')
                  .map((cat) => (
                    <option key={cat.id || cat.slug} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* 6. Platforms Multi-Select Checkboxes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
                Compatible Platforms <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ALL_PLATFORMS.map((plat) => {
                  const isChecked = selectedPlatforms.includes(plat);
                  const cfg = PLATFORM_CONFIGS[plat];
                  return (
                    <button
                      type="button"
                      key={plat}
                      onClick={() => togglePlatform(plat)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        isChecked
                          ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                          : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                          isChecked
                            ? 'bg-amber-500 border-amber-500 text-white'
                            : 'border-zinc-300 dark:border-zinc-600'
                        }`}
                      >
                        {isChecked && '✓'}
                      </div>
                      <span className="truncate">{plat}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 shadow-md transition-all cursor-pointer disabled:opacity-60 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-400 dark:text-amber-600" />
                <span>Submit For Approval</span>
              </button>
            </div>
          </form>
          </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
