import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Eye,
  Copy,
  Heart,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PromptItem } from '../types';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface UserDashboardProps {
  onOpenAddPrompt: () => void;
  onOpenPromptModal: (prompt: PromptItem) => void;
  onGoHome: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  onOpenAddPrompt,
  onOpenPromptModal,
  onGoHome,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [userPrompts, setUserPrompts] = useState<PromptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    if (!currentUser) {
      setUserPrompts([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'prompts'),
      where('uid', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: PromptItem[] = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as PromptItem);
        });
        // Sort newest first
        items.sort((a, b) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
        });
        setUserPrompts(items);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching user prompts:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const approvedCount = userPrompts.filter((p) => p.status === 'approved').length;
  const pendingCount = userPrompts.filter((p) => p.status === 'pending').length;
  const rejectedCount = userPrompts.filter((p) => p.status === 'rejected').length;
  const totalCopies = userPrompts.reduce((acc, p) => acc + (p.copyCount || 0), 0);
  const totalViews = userPrompts.reduce((acc, p) => acc + (p.views || 0), 0);

  const displayedPrompts = userPrompts.filter((p) => {
    if (statusFilter === 'all') return true;
    return p.status === statusFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-8 border-b border-zinc-200/80 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider text-amber-500">
              Creator Dashboard
            </span>
          </div>
          <h1 className="font-heading font-extrabold text-3xl text-zinc-900 dark:text-white">
            Hello, {userProfile?.displayName || currentUser?.displayName || currentUser?.email?.split('@')[0]}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your AI prompt submissions, monitor approval status, and check viewer metrics.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onOpenAddPrompt}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 shadow-md cursor-pointer transition-all"
        >
          <PlusCircle className="w-4 h-4 text-amber-400 dark:text-amber-600" />
          <span>+ Add New Prompt</span>
        </motion.button>
      </div>

      {/* 3 Dashboard Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 my-8">
        {/* Total Prompts */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#141618] border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Prompts</p>
            <h3 className="font-heading font-extrabold text-2xl text-zinc-900 dark:text-white">
              {userPrompts.length}
            </h3>
          </div>
        </div>

        {/* Approved Count */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#141618] border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Approved</p>
            <h3 className="font-heading font-extrabold text-2xl text-emerald-600 dark:text-emerald-400">
              {approvedCount}
            </h3>
          </div>
        </div>

        {/* Pending Count */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#141618] border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Pending Review</p>
            <h3 className="font-heading font-extrabold text-2xl text-amber-600 dark:text-amber-400">
              {pendingCount}
            </h3>
          </div>
        </div>

        {/* Total Views */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#141618] border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Views</p>
            <h3 className="font-heading font-extrabold text-2xl text-purple-600 dark:text-purple-400">
              {totalViews}
            </h3>
          </div>
        </div>

        {/* Total Copies */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#141618] border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Copy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Prompt Copies</p>
            <h3 className="font-heading font-extrabold text-2xl text-rose-600 dark:text-rose-400">
              {totalCopies}
            </h3>
          </div>
        </div>
      </div>

      {/* Filter Tabs for Submissions */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: `All (${userPrompts.length})` },
            { id: 'approved', label: `Approved (${approvedCount})` },
            { id: 'pending', label: `Pending (${pendingCount})` },
            { id: 'rejected', label: `Rejected (${rejectedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                  : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List / Table of User Prompts */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse"
            />
          ))}
        </div>
      ) : displayedPrompts.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-[#141618] rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <Sparkles className="w-12 h-12 mx-auto text-zinc-400 mb-3" />
          <h4 className="font-heading font-bold text-lg text-zinc-900 dark:text-white mb-1">
            No submissions in this category
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
            {userPrompts.length === 0
              ? 'You have not submitted any prompts yet. Start by adding your first one!'
              : 'No prompts match the selected status filter.'}
          </p>
          <button
            onClick={onOpenAddPrompt}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 cursor-pointer"
          >
            + Submit New Prompt
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#141618] rounded-2xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 text-zinc-400 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Prompt</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Platforms</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Metrics</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {displayedPrompts.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    {/* Prompt Preview */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 bg-zinc-100 dark:bg-zinc-800"
                        />
                        <div className="max-w-xs">
                          <p className="font-bold text-zinc-900 dark:text-white truncate">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                            {item.promptText}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        {item.category}
                      </span>
                    </td>

                    {/* Platforms */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {item.platform?.map((p) => (
                          <span
                            key={p}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Approved</span>
                        </span>
                      )}
                      {item.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                          <Clock className="w-3 h-3" />
                          <span>Pending</span>
                        </span>
                      )}
                      {item.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                          <XCircle className="w-3 h-3" />
                          <span>Rejected</span>
                        </span>
                      )}
                    </td>

                    {/* Metrics */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-3 text-zinc-500 text-[11px]">
                        <span className="flex items-center gap-1" title="Views">
                          <Eye className="w-3.5 h-3.5" />
                          {item.views || 0}
                        </span>
                        <span className="flex items-center gap-1" title="Copies">
                          <Copy className="w-3.5 h-3.5" />
                          {item.copyCount || 0}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onOpenPromptModal(item)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
                      >
                        View Card
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
