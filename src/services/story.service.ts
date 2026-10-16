import { Story, ApiResponse } from '@/types';
import { initialStories } from '@/constants/initial-data';

const STORIES_STORAGE_KEY = 'sanctuary_stories_v2';
const STORIES_ARCHIVE_STORAGE_KEY = 'sanctuary_stories_archive_v2';

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
    return { success: true, data: [...this.stories] };
  }

  public async getArchivedStories(): Promise<ApiResponse<Story[]>> {
    return { success: true, data: [...this.archivedStories] };
  }

  public async createStory(payload: Omit<Story, 'id' | 'createdAt' | 'expiresAt' | 'reactions' | 'replies'>): Promise<ApiResponse<Story>> {
    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const newStory: Story = {
      ...payload,
      id: `story_${Date.now()}`,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      reactions: [],
      replies: [],
      isArchived: false,
    };
    
    // Add to active stories
    this.stories.unshift(newStory);
    
    // Also preserve in permanent Story Archive vault forever!
    this.archivedStories.unshift({ ...newStory, isArchived: true });

    this.saveStories();
    this.notify();
    return { success: true, data: newStory };
  }

  public async reactToStory(storyId: string, emoji: string, userId: string): Promise<ApiResponse<Story>> {
    const story = this.stories.find(s => s.id === storyId) || this.archivedStories.find(s => s.id === storyId);
    if (!story) throw new Error('Story not found');
    story.reactions.push({ emoji, userId });
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
