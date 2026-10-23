import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  increment,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { PromptItem, CategoryItem } from '../types';
import { INITIAL_CATEGORIES, INITIAL_PROMPTS } from '../data/seedData';

// Seed initial database collections if empty
export async function seedInitialDataIfNeeded(): Promise<void> {
  try {
    const categoriesSnap = await getDocs(collection(db, 'categories'));
    if (categoriesSnap.empty) {
      console.log('Seeding initial categories...');
      for (const cat of INITIAL_CATEGORIES) {
        await setDoc(doc(db, 'categories', cat.id), {
          name: cat.name,
          slug: cat.slug,
          count: 0,
          createdAt: serverTimestamp(),
        });
      }
    }

    const promptsSnap = await getDocs(query(collection(db, 'prompts'), limit(2)));
    if (promptsSnap.empty) {
      console.log('Seeding initial curated prompts...');
      for (const prompt of INITIAL_PROMPTS) {
        await addDoc(collection(db, 'prompts'), {
          ...prompt,
          createdAt: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    console.warn('Seed operation skipped or failed:', error);
  }
}

// Increment prompt copy count
export async function incrementCopyCount(promptId: string): Promise<void> {
  if (!promptId || promptId.startsWith('seed-')) return;
  try {
    const promptRef = doc(db, 'prompts', promptId);
    await updateDoc(promptRef, {
      copyCount: increment(1),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `prompts/${promptId}`);
  }
}

// Increment prompt view count
export async function incrementViewCount(promptId: string): Promise<void> {
  if (!promptId || promptId.startsWith('seed-')) return;
  try {
    const promptRef = doc(db, 'prompts', promptId);
    await updateDoc(promptRef, {
      views: increment(1),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `prompts/${promptId}`);
  }
}

// Toggle or increment like count
export async function incrementLikeCount(promptId: string): Promise<void> {
  if (!promptId || promptId.startsWith('seed-')) return;
  try {
    const promptRef = doc(db, 'prompts', promptId);
    await updateDoc(promptRef, {
      likes: increment(1),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `prompts/${promptId}`);
  }
}

// User submit prompt
export async function submitPrompt(data: {
  title: string;
  promptText: string;
  negativePrompt?: string;
  imageUrl: string;
  platform: string[];
  category: string;
  userEmail: string;
  uid: string;
}): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'prompts'), {
      title: data.title.trim(),
      promptText: data.promptText.trim(),
      negativePrompt: data.negativePrompt?.trim() || '',
      imageUrl: data.imageUrl.trim(),
      platform: data.platform,
      category: data.category,
      status: 'pending',
      copyCount: 0,
      views: 0,
      likes: 0,
      createdBy: data.userEmail,
      uid: data.uid,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'prompts');
    throw error;
  }
}

// Admin update prompt status (Approve / Reject)
export async function updatePromptStatus(
  promptId: string,
  status: 'approved' | 'rejected'
): Promise<void> {
  try {
    const promptRef = doc(db, 'prompts', promptId);
    await updateDoc(promptRef, { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `prompts/${promptId}`);
    throw error;
  }
}

// Admin edit prompt details (supports updating title, prompt, photo/imageUrl, status, category, platforms)
export async function updatePromptDetails(
  promptId: string,
  data: Partial<Pick<PromptItem, 'title' | 'promptText' | 'negativePrompt' | 'imageUrl' | 'category' | 'platform' | 'status'>>
): Promise<void> {
  try {
    const promptRef = doc(db, 'prompts', promptId);
    await updateDoc(promptRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `prompts/${promptId}`);
    throw error;
  }
}

// Admin directly create and publish approved prompt with photo
export async function createAdminPromptDirectly(data: {
  title: string;
  promptText: string;
  negativePrompt?: string;
  imageUrl: string;
  platform: string[];
  category: string;
  userEmail: string;
  uid: string;
}): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'prompts'), {
      title: data.title.trim(),
      promptText: data.promptText.trim(),
      negativePrompt: data.negativePrompt?.trim() || '',
      imageUrl: data.imageUrl.trim(),
      platform: data.platform,
      category: data.category,
      status: 'approved',
      copyCount: 0,
      views: 0,
      likes: 0,
      createdBy: data.userEmail,
      uid: data.uid,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'prompts');
    throw error;
  }
}

// Admin delete prompt
export async function deletePromptDoc(promptId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'prompts', promptId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `prompts/${promptId}`);
    throw error;
  }
}

// Admin add category
export async function addCategoryDoc(name: string): Promise<void> {
  try {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    await addDoc(collection(db, 'categories'), {
      name: name.trim(),
      slug,
      count: 0,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'categories');
    throw error;
  }
}

// Admin delete category
export async function deleteCategoryDoc(catId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'categories', catId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `categories/${catId}`);
    throw error;
  }
}
