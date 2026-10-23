import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  LayoutDashboard,
  Clock,
  Layers,
  Users as UsersIcon,
  FolderTree,
  Check,
  X,
  Trash2,
  Edit3,
  Search,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  Eye,
  Copy,
  Plus,
  RefreshCw,
  LogOut,
  ChevronRight,
  ShieldAlert,
  Globe,
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  Sliders,
  Type,
  ExternalLink,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db, SUPER_ADMIN_EMAIL, isSuperAdmin } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { PromptItem, UserProfile, CategoryItem, PlatformName, SiteSettings } from '../types';
import {
  updatePromptStatus,
  deletePromptDoc,
  updatePromptDetails,
  addCategoryDoc,
  deleteCategoryDoc,
  createAdminPromptDirectly,
} from '../services/promptService';
import {
  getSiteSettings,
  updateSiteSettings,
  DEFAULT_SITE_SETTINGS,
} from '../services/siteSettingsService';
import { uploadPromptImage } from '../utils/imageUpload';
import { ALL_PLATFORMS, PLATFORM_CONFIGS } from '../utils/platforms';
import toast from 'react-hot-toast';

interface AdminDashboardProps {
  onGoHome: () => void;
  onOpenPromptModal: (p: PromptItem) => void;
}

type AdminTab = 'dashboard' | 'website_cms' | 'prompts' | 'pending' | 'users' | 'categories';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onGoHome,
  onOpenPromptModal,
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // Real-time collections
  const [allPrompts, setAllPrompts] = useState<PromptItem[]>([]);
  const [pendingPrompts, setPendingPrompts] = useState<PromptItem[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Site Settings (Website CMS) State
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Search inside All Prompts
  const [promptSearch, setPromptSearch] = useState('');

  // Edit Prompt State
  const [editingPrompt, setEditingPrompt] = useState<PromptItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPromptText, setEditPromptText] = useState('');
  const [editNegative, setEditNegative] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPlatforms, setEditPlatforms] = useState<PlatformName[]>([]);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'approved' | 'pending' | 'rejected'>('approved');
  const [isUpdatingPrompt, setIsUpdatingPrompt] = useState(false);

  // Create Prompt directly in Admin
  const [isCreatingPrompt, setIsCreatingPrompt] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPromptText, setNewPromptText] = useState('');
  const [newNegative, setNewNegative] = useState('');
  const [newCategory, setNewCategory] = useState('Photorealistic');
  const [newPlatforms, setNewPlatforms] = useState<PlatformName[]>(['Midjourney', 'Leonardo AI']);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string>('');
  const [isSavingNewPrompt, setIsSavingNewPrompt] = useState(false);

  // Delete Prompt confirmation state
  const [deletingPromptId, setDeletingPromptId] = useState<string | null>(null);

  // New Category input
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // Protection: alisahab62525@gmail.com is the ONLY Super Admin
  const isSuper = isSuperAdmin(currentUser?.email);

  // Load site settings
  useEffect(() => {
    if (!isSuper) return;
    getSiteSettings().then((s) => setSiteSettings(s));
  }, [isSuper]);

  // Real-time listeners
  useEffect(() => {
    if (!isSuper) return;

    // Listen to pending
    const qPending = query(
      collection(db, 'prompts'),
      where('status', '==', 'pending')
    );
    const unsubPending = onSnapshot(qPending, (snap) => {
      const items: PromptItem[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as PromptItem));
      setPendingPrompts(items);
    });

    // Listen to all prompts
    const unsubAll = onSnapshot(collection(db, 'prompts'), (snap) => {
      const items: PromptItem[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as PromptItem));
      // Sort newest first
      items.sort((a, b) => {
        const tA = a.createdAt?.seconds || 0;
        const tB = b.createdAt?.seconds || 0;
        return tB - tA;
      });
      setAllPrompts(items);
      setLoading(false);
    });

    // Listen to users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const items: UserProfile[] = [];
      snap.forEach((d) => items.push({ uid: d.id, ...d.data() } as UserProfile));
      setAllUsers(items);
    });

    // Listen to categories
    const unsubCats = onSnapshot(collection(db, 'categories'), (snap) => {
      const items: CategoryItem[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as CategoryItem));
      setCategoriesList(items);
    });

    return () => {
      unsubPending();
      unsubAll();
      unsubUsers();
      unsubCats();
    };
  }, [isSuper]);

  // If user is not Super Admin, show access restricted guard
  if (!isSuper) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-[#141618] rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-zinc-900 dark:text-white">
            Access Restricted
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            The Admin Portal is protected and only accessible when signed in as Super Admin.
          </p>
          <div className="pt-2">
            <button
              onClick={onGoHome}
              className="px-5 py-2.5 rounded-xl font-semibold text-xs bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md cursor-pointer"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard Analytics calculations
  const totalUsersCount = allUsers.length;
  const totalPromptsCount = allPrompts.length;
  const pendingRequestsCount = pendingPrompts.length;
  const totalCopyEvents = allPrompts.reduce((acc, p) => acc + (p.copyCount || 0), 0);

  // Top 5 Most Copied Prompts for Recharts
  const topCopiedPrompts = [...allPrompts]
    .sort((a, b) => (b.copyCount || 0) - (a.copyCount || 0))
    .slice(0, 5)
    .map((p) => ({
      name: p.title.length > 18 ? p.title.substring(0, 18) + '...' : p.title,
      copies: p.copyCount || 0,
    }));

  // Recent 5 submitted prompts
  const recentSubmissions = allPrompts.slice(0, 5);

  // Save Website CMS Settings
  const handleSaveSiteSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await updateSiteSettings(siteSettings);
      toast.success('Website text & settings updated successfully!', { icon: '🌐' });
    } catch (err: any) {
      toast.error('Failed to update website settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Open Edit Prompt Modal
  const openEditModal = (prompt: PromptItem) => {
    setEditingPrompt(prompt);
    setEditTitle(prompt.title);
    setEditPromptText(prompt.promptText);
    setEditNegative(prompt.negativePrompt || '');
    setEditCategory(prompt.category);
    setEditPlatforms((prompt.platform || []) as PlatformName[]);
    setEditImageUrl(prompt.imageUrl);
    setEditImagePreview(prompt.imageUrl);
    setEditImageFile(null);
    setEditStatus(prompt.status);
  };

  // Handle Edit Photo File Change
  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImageFile(file);
      setEditImagePreview(URL.createObjectURL(file));
    }
  };

  // Save Edit Prompt with Photo
  const handleSaveEdit = async () => {
    if (!editingPrompt) return;
    setIsUpdatingPrompt(true);
    try {
      let finalUrl = editImageUrl;
      if (editImageFile) {
        finalUrl = await uploadPromptImage(editImageFile, currentUser?.uid || 'admin');
      }

      await updatePromptDetails(editingPrompt.id, {
        title: editTitle,
        promptText: editPromptText,
        negativePrompt: editNegative,
        category: editCategory,
        platform: editPlatforms,
        imageUrl: finalUrl,
        status: editStatus,
      });

      toast.success('Prompt & photo updated successfully!', { icon: '🎨' });
      setEditingPrompt(null);
    } catch (err: any) {
      toast.error('Failed to update prompt');
    } finally {
      setIsUpdatingPrompt(false);
    }
  };

  // Handle Create Prompt Directly from Admin
  const handleCreatePromptDirectly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPromptText.trim()) {
      toast.error('Title and prompt text are required');
      return;
    }
    if (!newImageUrl.trim() && !newImageFile) {
      toast.error('Please upload an image or provide an image link');
      return;
    }

    setIsSavingNewPrompt(true);
    try {
      let finalImg = newImageUrl.trim();
      if (newImageFile) {
        finalImg = await uploadPromptImage(newImageFile, currentUser?.uid || 'admin');
      }

      await createAdminPromptDirectly({
        title: newTitle,
        promptText: newPromptText,
        negativePrompt: newNegative,
        imageUrl: finalImg,
        platform: newPlatforms,
        category: newCategory,
        userEmail: currentUser?.email || SUPER_ADMIN_EMAIL,
        uid: currentUser?.uid || 'admin',
      });

      toast.success('New prompt published directly to website!', { icon: '🚀' });
      setIsCreatingPrompt(false);
      setNewTitle('');
      setNewPromptText('');
      setNewNegative('');
      setNewImageUrl('');
      setNewImageFile(null);
      setNewImagePreview('');
    } catch (err: any) {
      toast.error('Failed to create prompt');
    } finally {
      setIsSavingNewPrompt(false);
    }
  };

  // Approve Handler
  const handleApprove = async (id: string, title: string) => {
    try {
      await updatePromptStatus(id, 'approved');
      toast.success(`Approved "${title}"`, { icon: '✅' });
    } catch (err: any) {
      toast.error('Failed to approve');
    }
  };

  // Reject Handler
  const handleReject = async (id: string, title: string) => {
    try {
      await updatePromptStatus(id, 'rejected');
      toast.success(`Rejected "${title}"`, { icon: '❌' });
    } catch (err: any) {
      toast.error('Failed to reject');
    }
  };

  // Delete Prompt
  const handleConfirmDelete = async () => {
    if (!deletingPromptId) return;
    try {
      await deletePromptDoc(deletingPromptId);
      toast.success('Prompt deleted permanently');
      setDeletingPromptId(null);
    } catch (err) {
      toast.error('Failed to delete prompt');
    }
  };

  // Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      setIsAddingCategory(true);
      await addCategoryDoc(newCategoryName);
      toast.success(`Category "${newCategoryName}" added!`);
      setNewCategoryName('');
    } catch (err) {
      toast.error('Failed to add category');
    } finally {
      setIsAddingCategory(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (catId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      await deleteCategoryDoc(catId);
      toast.success(`Deleted category "${name}"`);
    } catch (err) {
      toast.error('Failed to delete category');
    }
  };

  // Filtered Prompts
  const filteredAllPrompts = allPrompts.filter((p) => {
    if (!promptSearch.trim()) return true;
    const q = promptSearch.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.promptText?.toLowerCase().includes(q) ||
      p.createdBy?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0c0d0e] flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141618] p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          {/* Logo & Super Admin Badge */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-heading font-extrabold text-lg text-zinc-900 dark:text-white">
                  Admin<span className="text-amber-500">Vault</span>
                </span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-400">
              <p className="font-bold">Super Admin Master Panel</p>
              <p className="truncate text-zinc-500 dark:text-zinc-400">{SUPER_ADMIN_EMAIL}</p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>Analytics Dashboard</span>
              </span>
            </button>

            {/* WEBSITE CMS / TEXT & PHOTO EDITOR */}
            <button
              onClick={() => setActiveTab('website_cms')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'website_cms'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-amber-600 dark:text-amber-400">Website CMS / Text Editor</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('prompts')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'prompts'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Layers className="w-4 h-4" />
                <span>All Prompts & Photos</span>
              </span>
              <span className="text-[11px] text-zinc-400">{allPrompts.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('pending')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Clock className="w-4 h-4" />
                <span>Pending Approvals</span>
              </span>
              {pendingRequestsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white animate-pulse">
                  {pendingRequestsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <UsersIcon className="w-4 h-4" />
                <span>Users</span>
              </span>
              <span className="text-[11px] text-zinc-400">{allUsers.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <FolderTree className="w-4 h-4" />
                <span>Categories</span>
              </span>
              <span className="text-[11px] text-zinc-400">{categoriesList.length}</span>
            </button>
          </nav>
        </div>

        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={onGoHome}
            className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Return to Public Site</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {/* TAB 1: DASHBOARD ANALYTICS */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-zinc-900 dark:text-white">
                  Platform Analytics & Overview
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Real-time metrics, prompt copy events, moderation queue, and user activity.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('website_cms')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Website Text & Photos</span>
              </button>
            </div>

            {/* 4 Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#141618] border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Users</p>
                  <h3 className="font-heading font-extrabold text-2xl text-zinc-900 dark:text-white mt-1">
                    {totalUsersCount}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <UsersIcon className="w-6 h-6" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#141618] border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Prompts</p>
                  <h3 className="font-heading font-extrabold text-2xl text-zinc-900 dark:text-white mt-1">
                    {totalPromptsCount}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Layers className="w-6 h-6" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#141618] border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Pending Requests</p>
                  <h3 className="font-heading font-extrabold text-2xl text-amber-600 dark:text-amber-400 mt-1">
                    {pendingRequestsCount}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#141618] border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Copy Events</p>
                  <h3 className="font-heading font-extrabold text-2xl text-rose-600 dark:text-rose-400 mt-1">
                    {totalCopyEvents.toLocaleString()}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Copy className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Recharts Bar Chart: Top 5 Most Copied Prompts */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#141618] border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-heading font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-500" />
                    <span>Top 5 Most Copied Prompts</span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Highest viral engagement and user copy triggers across platforms
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                {topCopiedPrompts.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topCopiedPrompts} margin={{ top: 10, right: 20, left: -20, bottom: 20 }}>
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#888' }}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis tick={{ fontSize: 11, fill: '#888' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          borderRadius: '12px',
                          border: 'none',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="copies" radius={[8, 8, 0, 0]}>
                        {topCopiedPrompts.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6'][index % 5]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-zinc-400">
                    No copy event data yet
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#141618] border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
              <h3 className="font-heading font-bold text-lg text-zinc-900 dark:text-white mb-4">
                Recent Submissions
              </h3>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {recentSubmissions.map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.imageUrl}
                        alt={p.title}
                        className="w-10 h-10 rounded-xl object-cover bg-zinc-100 dark:bg-zinc-800"
                      />
                      <div>
                        <p className="text-xs font-bold text-zinc-900 dark:text-white line-clamp-1">
                          {p.title}
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          by {p.createdBy} · {p.category}
                        </p>
                      </div>
                    </div>
                    <div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          p.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : p.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-rose-500/10 text-rose-600'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WEBSITE CMS / TEXT & PHOTO EDITOR */}
        {activeTab === 'website_cms' && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-2">
                <Globe className="w-3.5 h-3.5" />
                <span>Website Content & Visuals Control</span>
              </div>
              <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-zinc-900 dark:text-white">
                Live Website Editor (CMS)
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Directly change any text on your website, control headlines, announcements, and customize the visitor experience.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Form Controls */}
              <div className="lg:col-span-7">
                <form onSubmit={handleSaveSiteSettings} className="p-6 rounded-3xl bg-white dark:bg-[#141618] border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
                  <h3 className="font-heading font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <Type className="w-4 h-4 text-amber-500" />
                    <span>Hero Section Text</span>
                  </h3>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Top Badge Text
                    </label>
                    <input
                      type="text"
                      value={siteSettings.heroBadge}
                      onChange={(e) => setSiteSettings({ ...siteSettings, heroBadge: e.target.value })}
                      placeholder="e.g. Discover Curated AI Art & Prompts"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Main Headline (First Part)
                    </label>
                    <input
                      type="text"
                      value={siteSettings.heroHeadline}
                      onChange={(e) => setSiteSettings({ ...siteSettings, heroHeadline: e.target.value })}
                      placeholder="e.g. Supercharge Your AI Visuals with"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Headline Gradient Highlight (Second Part)
                    </label>
                    <input
                      type="text"
                      value={siteSettings.heroHeadlineHighlight}
                      onChange={(e) => setSiteSettings({ ...siteSettings, heroHeadlineHighlight: e.target.value })}
                      placeholder="e.g. One-Click Prompts"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500 font-bold text-amber-600 dark:text-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Hero Subtitle / Description Text
                    </label>
                    <textarea
                      rows={3}
                      value={siteSettings.heroSubtitle}
                      onChange={(e) => setSiteSettings({ ...siteSettings, heroSubtitle: e.target.value })}
                      placeholder="Write your website description..."
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500 leading-relaxed"
                    />
                  </div>

                  <h3 className="font-heading font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 pt-2">
                    <Sliders className="w-4 h-4 text-rose-500" />
                    <span>Top Announcement Bar</span>
                  </h3>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="announcementToggle"
                      checked={siteSettings.announcementEnabled || false}
                      onChange={(e) => setSiteSettings({ ...siteSettings, announcementEnabled: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                    />
                    <label htmlFor="announcementToggle" className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer">
                      Enable Top Announcement Banner across the website
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Announcement Banner Text
                    </label>
                    <input
                      type="text"
                      value={siteSettings.announcementText || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, announcementText: e.target.value })}
                      placeholder="e.g. 🚀 Welcome to PromptVault! Discover new trending prompts daily."
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingSettings}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 shadow-md cursor-pointer disabled:opacity-60 flex items-center gap-2"
                    >
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>{isSavingSettings ? 'Saving...' : 'Save & Publish Live Text'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Real-Time Live Preview */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between mb-3 text-xs font-bold uppercase text-zinc-400">
                    <span>Live Preview (How visitors see it)</span>
                    <span className="text-emerald-500 flex items-center gap-1 text-[10px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      Live
                    </span>
                  </div>

                  {/* Announcement Preview */}
                  {siteSettings.announcementEnabled && siteSettings.announcementText && (
                    <div className="mb-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-2 text-center text-[11px] font-semibold text-white shadow-xs">
                      {siteSettings.announcementText}
                    </div>
                  )}

                  {/* Hero Preview Card */}
                  <div className="p-6 rounded-2xl bg-white dark:bg-[#141618] border border-zinc-200/80 dark:border-zinc-800 text-center space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      <Sparkles className="w-3 h-3" />
                      <span>{siteSettings.heroBadge || 'Badge Text'}</span>
                    </div>

                    <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-zinc-900 dark:text-white leading-tight">
                      {siteSettings.heroHeadline || 'Headline'}{' '}
                      <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">
                        {siteSettings.heroHeadlineHighlight || 'Highlight'}
                      </span>
                    </h2>

                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {siteSettings.heroSubtitle || 'Subtitle'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ALL PROMPTS & PHOTOS (FULL EDITING & PHOTO REPLACEMENT) */}
        {activeTab === 'prompts' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-zinc-900 dark:text-white">
                  All Prompts & Photos
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Change photos, edit title/prompt text, assign categories, platforms, or delete items.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative w-full sm:w-60">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                  <input
                    type="text"
                    value={promptSearch}
                    onChange={(e) => setPromptSearch(e.target.value)}
                    placeholder="Search prompt or author..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Add Prompt Button Directly */}
                <button
                  onClick={() => setIsCreatingPrompt(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm hover:opacity-90 transition-opacity whitespace-nowrap cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-amber-500" />
                  <span>+ New Prompt</span>
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-[#141618] rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 text-zinc-400 uppercase font-semibold">
                      <th className="py-3 px-4">Photo Preview</th>
                      <th className="py-3 px-4">Title & Prompt Text</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Copies</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {filteredAllPrompts.map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                        {/* Photo */}
                        <td className="py-3 px-4">
                          <div className="relative group w-14 h-14 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                            <img
                              src={p.imageUrl}
                              alt={p.title}
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => openEditModal(p)}
                              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-semibold cursor-pointer"
                              title="Change Photo"
                            >
                              Edit
                            </button>
                          </div>
                        </td>

                        {/* Text */}
                        <td className="py-3 px-4 max-w-sm">
                          <p className="font-bold text-zinc-900 dark:text-white truncate">
                            {p.title}
                          </p>
                          <p className="text-[11px] text-zinc-500 line-clamp-2 mt-0.5 font-mono">
                            {p.promptText}
                          </p>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                            {p.category}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              p.status === 'approved'
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : p.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-600'
                                : 'bg-rose-500/10 text-rose-600'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>

                        {/* Copies */}
                        <td className="py-3 px-4 font-semibold">{p.copyCount || 0}</td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => openEditModal(p)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="Edit prompt & photo"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => setDeletingPromptId(p.id)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                            title="Delete prompt"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PENDING APPROVALS */}
        {activeTab === 'pending' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-zinc-900 dark:text-white">
                  Pending Approvals Queue
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Review submitted prompts from the community before they appear on the homepage.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                {pendingPrompts.length} Pending
              </span>
            </div>

            {pendingPrompts.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-[#141618] rounded-3xl border border-zinc-200 dark:border-zinc-800">
                <Check className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="font-heading font-bold text-lg text-zinc-900 dark:text-white">
                  Queue is clear!
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  No submissions are waiting for moderation right now.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingPrompts.map((p) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="rounded-2xl bg-white dark:bg-[#141618] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm flex flex-col"
                  >
                    <div className="h-48 overflow-hidden bg-zinc-100 dark:bg-zinc-800 relative">
                      <img
                        src={p.imageUrl}
                        alt={p.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                        {p.category}
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white line-clamp-1">
                          {p.title}
                        </h4>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Submitted by: {p.createdBy}
                        </p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 line-clamp-3 bg-zinc-50 dark:bg-zinc-900 p-2.5 rounded-xl font-mono">
                          "{p.promptText}"
                        </p>
                      </div>

                      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(p.id, p.title)}
                          className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleReject(p.id, p.title)}
                          className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: USERS */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div>
              <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-zinc-900 dark:text-white">
                Registered Users Directory
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                View creator profiles, permission roles, and submission participation.
              </p>
            </div>

            <div className="bg-white dark:bg-[#141618] rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 text-zinc-400 uppercase font-semibold">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Prompts Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {allUsers.map((u) => {
                    const submittedCount = allPrompts.filter(
                      (p) => p.uid === u.uid || p.createdBy === u.email
                    ).length;
                    const isUserAdmin = isSuperAdmin(u.email);
                    return (
                      <tr key={u.uid} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                        <td className="py-3 px-4 font-bold text-zinc-900 dark:text-white">
                          {u.displayName || 'Creator'}
                        </td>
                        <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                          {u.email}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isUserAdmin
                                ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                            }`}
                          >
                            {isUserAdmin ? 'Super Admin' : 'User'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold">{submittedCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: CATEGORIES */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div>
              <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-zinc-900 dark:text-white">
                Category Management
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Add new prompt categories and manage library taxonomies.
              </p>
            </div>

            {/* Add Category Form */}
            <form
              onSubmit={handleAddCategory}
              className="p-5 rounded-2xl bg-white dark:bg-[#141618] border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-3"
            >
              <input
                type="text"
                required
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter new category name (e.g. Futuristic Vehicles, Minimalist Architecture)..."
                className="flex-1 px-4 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={isAddingCategory}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </form>

            {/* Categories List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {categoriesList.map((cat) => {
                const count = allPrompts.filter((p) => p.category === cat.name).length;
                return (
                  <div
                    key={cat.id || cat.slug}
                    className="p-4 rounded-2xl bg-white dark:bg-[#141618] border border-zinc-200 dark:border-zinc-800 flex items-center justify-between shadow-xs"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                        {cat.name}
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {count} prompts in library
                      </p>
                    </div>
                    {cat.slug !== 'all' && (
                      <button
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* ================= EDIT PROMPT & PHOTO MODAL ================= */}
      {editingPrompt && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#141618] rounded-3xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">
                  Admin Editor
                </span>
                <h3 className="font-heading font-bold text-xl text-zinc-900 dark:text-white">
                  Edit Prompt Details & Change Photo
                </h3>
              </div>
              <button
                onClick={() => setEditingPrompt(null)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo Preview & Replacement Box */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Prompt Image / Photo
              </label>
              <div className="flex flex-col sm:flex-row gap-4 items-start bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                {/* Current or selected image */}
                <div className="w-32 h-32 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0 border border-zinc-300 dark:border-zinc-700">
                  <img
                    src={editImagePreview || editImageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 space-y-3 w-full">
                  <div>
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Upload New Image File:
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditFileChange}
                      className="block w-full text-xs text-zinc-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-white dark:file:bg-white dark:file:text-zinc-900 hover:file:opacity-90 cursor-pointer"
                    />
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Or Change Image URL Directly:
                    </span>
                    <input
                      type="url"
                      value={editImageUrl}
                      onChange={(e) => {
                        setEditImageUrl(e.target.value);
                        setEditImagePreview(e.target.value);
                      }}
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                Title
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-semibold"
              />
            </div>

            {/* Main Prompt */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                Prompt Text
              </label>
              <textarea
                rows={4}
                value={editPromptText}
                onChange={(e) => setEditPromptText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-mono leading-relaxed"
              />
            </div>

            {/* Negative Prompt */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                Negative Prompt
              </label>
              <textarea
                rows={2}
                value={editNegative}
                onChange={(e) => setEditNegative(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-mono"
              />
            </div>

            {/* Category & Status Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white cursor-pointer"
                >
                  <option value="approved">Approved (Live on website)</option>
                  <option value="pending">Pending Review</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingPrompt(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isUpdatingPrompt}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 shadow-md cursor-pointer disabled:opacity-60 flex items-center gap-2"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{isUpdatingPrompt ? 'Saving Photo & Details...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CREATE PROMPT DIRECTLY MODAL ================= */}
      {isCreatingPrompt && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#141618] rounded-3xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">
                  Direct Publishing
                </span>
                <h3 className="font-heading font-bold text-xl text-zinc-900 dark:text-white">
                  Add New Prompt Directly to Website
                </h3>
              </div>
              <button
                onClick={() => setIsCreatingPrompt(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePromptDirectly} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Upload Photo or Paste Image URL *
                </label>
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setNewImageFile(file);
                        setNewImagePreview(URL.createObjectURL(file));
                      }
                    }}
                    className="block w-full text-xs text-zinc-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-white dark:file:bg-white dark:file:text-zinc-900 cursor-pointer"
                  />
                  <span className="text-xs text-zinc-400">OR</span>
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => {
                      setNewImageUrl(e.target.value);
                      setNewImagePreview(e.target.value);
                    }}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                  />
                </div>
                {newImagePreview && (
                  <div className="mt-2 text-center">
                    <img
                      src={newImagePreview}
                      alt="Preview"
                      className="h-28 mx-auto rounded-xl object-contain border border-zinc-200 dark:border-zinc-700"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Prompt Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Futuristic Cyberpunk Cityscape"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Prompt Text *
                </label>
                <textarea
                  rows={4}
                  required
                  value={newPromptText}
                  onChange={(e) => setNewPromptText(e.target.value)}
                  placeholder="Enter detailed prompt description..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                >
                  {categoriesList.filter((c) => c.slug !== 'all').map((cat) => (
                    <option key={cat.id || cat.slug} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreatingPrompt(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingNewPrompt}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md cursor-pointer disabled:opacity-60 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 text-amber-500" />
                  <span>{isSavingNewPrompt ? 'Publishing...' : 'Publish to Website'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPromptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="max-w-sm w-full bg-white dark:bg-[#141618] rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-lg text-zinc-900 dark:text-white">
              Delete Prompt?
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Are you sure you want to permanently delete this prompt from PromptVault? This cannot be undone.
            </p>
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => setDeletingPromptId(null)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
