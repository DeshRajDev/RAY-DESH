import { Story, ApiResponse } from '@/types';
import { initialStories } from '@/constants/initial-data';
import { ApiClient } from './api/client';

const STORIES_STORAGE_KEY = 'sanctuary_stories_v3';
const STORIES_ARCHIVE_STORAGE_KEY = 'sanctuary_stories_archive_v3';

class StoryService {
  private stories: Story[] = [];
  private archivedStories: Story[] = [];
  private listeners: ((stories: Story[]) => void)[] = [];

  constructor() {
    this.loadStories();
  }

  private loadStories() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORIES_STORAGE_KEY);
        if (stored) {
          this.stories = JSON.parse(stored);
        } else {
          this.stories = [...initialStories];
        }

        const storedArchive = localStorage.getItem(STORIES_ARCHIVE_STORAGE_KEY);
        if (storedArchive) {
          this.archivedStories = JSON.parse(storedArchive);
        } else {
          // Initialize archive with initial stories so history is never lost
          this.archivedStories = initialStories.map(s => ({ ...s, isArchived: true }));
        }
        return;
      } catch {
        // ignore
      }
    }
    this.stories = [...initialStories];
    this.archivedStories = initialStories.map(s => ({ ...s, isArchived: true }));
  }

  private saveStories() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORIES_STORAGE_KEY, JSON.stringify(this.stories));
        localStorage.setItem(STORIES_ARCHIVE_STORAGE_KEY, JSON.stringify(this.archivedStories));
      } catch {
        // ignore
      }
    }
  }

  public async getStories(): Promise<ApiResponse<Story[]>> {
    try {
      if (typeof window !== 'undefined') {
        const res = await ApiClient.getInstance().get<{ success: boolean; data: any[] }>('/stories');
        if (res && res.success && Array.isArray(res.data)) {
          const formatted: Story[] = res.data.map(item => ({
            id: item.id || item._id,
            authorId: item.authorId,
            type: item.type || 'image',
            mediaUrl: item.mediaUrl,
            text: item.text,
            backgroundColor: item.backgroundColor,
            songTitle: item.songTitle,
            songArtist: item.songArtist,
            caption: item.caption,
            durationSeconds: item.durationSeconds || 15,
            textOverlays: item.textOverlays || [],
            expiresAt: item.expiresAt,
            reactions: item.reactions || [],
            replies: item.replies || [],
            isArchived: !!item.isArchived,
            createdAt: item.createdAt || new Date().toISOString(),
          }));
          this.stories = formatted;
          this.saveStories();
        }
      }
    } catch {
      // Fallback
    }

    return { success: true, data: [...this.stories] };
  }

  public async getArchivedStories(): Promise<ApiResponse<Story[]>> {
    return { success: true, data: [...this.archivedStories] };
  }

  public async createStory(payload: Omit<Story, 'id' | 'createdAt' | 'expiresAt' | 'reactions' | 'replies'>): Promise<ApiResponse<Story>> {
    let createdStory: Story;
    try {
      const res = await ApiClient.getInstance().post<{ success: boolean; data: any }>('/stories', payload);
      if (res && res.success && res.data) {
        const item = res.data;
        createdStory = {
          id: item.id || item._id,
          authorId: item.authorId,
          type: item.type || 'image',
          mediaUrl: item.mediaUrl,
          text: item.text,
          backgroundColor: item.backgroundColor,
          songTitle: item.songTitle,
          songArtist: item.songArtist,
          caption: item.caption,
          durationSeconds: item.durationSeconds || payload.durationSeconds || 15,
          textOverlays: item.textOverlays || payload.textOverlays || [],
          expiresAt: item.expiresAt,
          reactions: [],
          replies: [],
          isArchived: false,
          createdAt: item.createdAt || new Date().toISOString(),
        };
      } else {
        throw new Error('Failed to create story');
      }
    } catch {
      const now = new Date();
      const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      createdStory = {
        ...payload,
        id: `story_${Date.now()}`,
        createdAt: now.toISOString(),
        expiresAt: expires.toISOString(),
        reactions: [],
        replies: [],
        isArchived: false,
      };
    }
    
    // Add to active stories
    this.stories.unshift(createdStory);
    this.archivedStories.unshift({ ...createdStory, isArchived: true });

    this.saveStories();
    this.notify();
    return { success: true, data: createdStory };
  }

  public async reactToStory(storyId: string, emoji: string, userId: string): Promise<ApiResponse<Story>> {
    const story = this.stories.find(s => s.id === storyId) || this.archivedStories.find(s => s.id === storyId);
    if (!story) throw new Error('Story not found');
    story.reactions.push({ emoji, userId });

    try {
      await ApiClient.getInstance().post(`/stories/${storyId}/react`, { emoji });
    } catch (err) {
      console.warn('Story reaction sync error:', err);
    }

    this.saveStories();
    this.notify();
    return { success: true, data: { ...story } };
  }

  public async replyToStory(storyId: string, text: string, userId: string): Promise<ApiResponse<Story>> {
    const story = this.stories.find(s => s.id === storyId) || this.archivedStories.find(s => s.id === storyId);
    if (!story) throw new Error('Story not found');
    story.replies.push({
      id: `reply_${Date.now()}`,
      userId,
      text,
      createdAt: new Date().toISOString(),
    });
    this.saveStories();
    this.notify();
    return { success: true, data: { ...story } };
  }

  public subscribe(listener: (stories: Story[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l([...this.stories]));
  }
}

export const storyService = new StoryService();
