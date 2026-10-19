import { Post, PostComment, ApiResponse } from '@/types';
import { initialPosts } from '@/constants/initial-data';
import { ApiClient } from './api/client';

const POSTS_STORAGE_KEY = 'sanctuary_posts_v3';

class PostService {
  private posts: Post[] = [];
  private listeners: ((posts: Post[]) => void)[] = [];

  constructor() {
    this.loadPosts();
  }

  private loadPosts(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(POSTS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            this.posts = parsed;
            return;
          }
        }
      } catch {
        // Fallback
      }
    }
    this.posts = [...initialPosts];
  }

  private savePosts(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(this.posts));
      } catch {
        // Ignore quota errors
      }
    }
  }

  public async getPosts(): Promise<ApiResponse<Post[]>> {
    try {
      if (typeof window !== 'undefined') {
        const res = await ApiClient.getInstance().get<{ success: boolean; data: any[] }>('/posts');
        if (res && res.success && Array.isArray(res.data)) {
          const formatted: Post[] = res.data.map(item => ({
            id: item.id || item._id,
            authorId: item.authorId,
            authorName: item.authorName || 'Partner',
            authorAvatar: item.authorAvatar || '',
            type: (item.mediaUrls && item.mediaUrls.length > 0 ? 'photo' : 'text') as Post['type'],
            content: item.caption || item.content || '',
            mediaUrls: item.mediaUrls || [],
            location: item.location,
            date: item.createdAt || new Date().toISOString(),
            likes: Array.isArray(item.likes) ? item.likes.map((l: any) => typeof l === 'string' ? l : l.userId) : [],
            reactions: Array.isArray(item.likes) ? item.likes.map((l: any) => ({ emoji: l.emoji || '❤️', userId: typeof l === 'string' ? l : l.userId })) : [],
            comments: Array.isArray(item.comments) ? item.comments.map((c: any) => ({
              id: c.id || c._id || `comm_${Math.random()}`,
              userId: c.userId,
              userName: c.userName || 'Partner',
              userAvatar: c.userAvatar || '',
              text: c.text,
              createdAt: c.createdAt || new Date().toISOString(),
            })) : [],
            isPinned: !!item.isPinned,
            createdAt: item.createdAt || new Date().toISOString(),
          }));
          this.posts = formatted;
          this.savePosts();
        }
      }
    } catch {
      // Fallback
    }

    return { success: true, data: [...this.posts] };
  }

  public async createPost(payload: Omit<Post, 'id' | 'likes' | 'reactions' | 'comments' | 'createdAt'>): Promise<ApiResponse<Post>> {
    let createdPost: Post;
    try {
      const res = await ApiClient.getInstance().post<{ success: boolean; data: any }>('/posts', {
        caption: payload.content || '',
        mediaUrls: payload.mediaUrls || [],
        location: payload.location,
        songTitle: payload.song?.title,
        songArtist: payload.song?.artist,
      });

      if (res && res.success && res.data) {
        const item = res.data;
        createdPost = {
          id: item.id || item._id,
          authorId: item.authorId,
          authorName: payload.authorName,
          authorAvatar: payload.authorAvatar,
          type: payload.type,
          content: item.caption,
          mediaUrls: item.mediaUrls || [],
          location: item.location,
          date: item.createdAt || new Date().toISOString(),
          likes: [],
          reactions: [],
          comments: [],
          isPinned: false,
          createdAt: item.createdAt || new Date().toISOString(),
        };
      } else {
        throw new Error('Failed to create post');
      }
    } catch {
      createdPost = {
        ...payload,
        id: `post_${Date.now()}`,
        likes: [],
        reactions: [],
        comments: [],
        createdAt: new Date().toISOString(),
      };
    }

    this.posts.unshift(createdPost);
    this.savePosts();
    this.notify();
    return { success: true, data: createdPost };
  }

  public async toggleLike(postId: string, userId: string): Promise<ApiResponse<Post>> {
    const post = this.posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found');
    const idx = post.likes.indexOf(userId);
    if (idx > -1) {
      post.likes.splice(idx, 1);
    } else {
      post.likes.push(userId);
    }

    try {
      await ApiClient.getInstance().post(`/posts/${postId}/like`, { emoji: '❤️' });
    } catch (err) {
      console.warn('Post like sync error:', err);
    }

    this.savePosts();
    this.notify();
    return { success: true, data: { ...post } };
  }

  public async addReaction(postId: string, emoji: string, userId: string): Promise<ApiResponse<Post>> {
    const post = this.posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found');
    post.reactions.push({ emoji, userId });

    try {
      await ApiClient.getInstance().post(`/posts/${postId}/like`, { emoji });
    } catch (err) {
      console.warn('Post reaction sync error:', err);
    }

    this.savePosts();
    this.notify();
    return { success: true, data: { ...post } };
  }

  public async addComment(postId: string, comment: Omit<PostComment, 'id' | 'createdAt'>): Promise<ApiResponse<Post>> {
    const post = this.posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found');
    const newComment: PostComment = {
      ...comment,
      id: `comm_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    post.comments.push(newComment);

    try {
      await ApiClient.getInstance().post(`/posts/${postId}/comment`, {
        text: comment.text,
      });
    } catch (err) {
      console.warn('Post comment sync error:', err);
    }

    this.savePosts();
    this.notify();
    return { success: true, data: { ...post } };
  }

  public subscribe(listener: (posts: Post[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l([...this.posts]));
  }
}

export const postService = new PostService();
