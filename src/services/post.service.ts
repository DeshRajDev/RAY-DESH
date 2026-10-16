import { Post, PostComment, ApiResponse } from '@/types';
import { initialPosts } from '@/constants/initial-data';

class PostService {
  private posts: Post[] = [...initialPosts];
  private listeners: ((posts: Post[]) => void)[] = [];

  public async getPosts(): Promise<ApiResponse<Post[]>> {
    return { success: true, data: [...this.posts] };
  }

  public async createPost(payload: Omit<Post, 'id' | 'likes' | 'reactions' | 'comments' | 'createdAt'>): Promise<ApiResponse<Post>> {
    const newPost: Post = {
      ...payload,
      id: `post_${Date.now()}`,
      likes: [],
      reactions: [],
      comments: [],
      createdAt: new Date().toISOString(),
    };
    this.posts.unshift(newPost);
    this.notify();
    return { success: true, data: newPost };
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
    this.notify();
    return { success: true, data: { ...post } };
  }

  public async addReaction(postId: string, emoji: string, userId: string): Promise<ApiResponse<Post>> {
    const post = this.posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found');
    post.reactions.push({ emoji, userId });
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
