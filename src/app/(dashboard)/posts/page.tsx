'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Flame, Heart, MessageCircle, Music, Send, Image as ImageIcon, MapPin, Sparkles } from 'lucide-react';
import { useApp } from '@/stores/app-context';
import { Post } from '@/types';
import { postService } from '@/services/post.service';
import { formatDate } from '@/lib/date-utils';

export default function PostsFeedPage() {
  const { user, partner, openMediaViewer, triggerHeartEffect } = useApp();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostPhoto, setNewPostPhoto] = useState('');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    postService.getPosts().then(res => setPosts(res.data ?? []));
    const unsubscribe = postService.subscribe(updated => setPosts(updated));
    return () => unsubscribe();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() && !newPostPhoto.trim()) return;

    await postService.createPost({
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatar,
      type: newPostPhoto ? 'photo' : 'text',
      content: newPostContent.trim(),
      mediaUrls: newPostPhoto ? [newPostPhoto] : [],
      date: new Date().toISOString(),
    });

    setNewPostContent('');
    setNewPostPhoto('');
  };

  const handleToggleLike = async (postId: string) => {
    await postService.toggleLike(postId, user.id);
    triggerHeartEffect();
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    await postService.addComment(postId, {
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      text,
    });

    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    triggerHeartEffect();
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#777777] mb-1">
          <Flame className="h-3.5 w-3.5 text-white" />
          <span>Private Moments Stream</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-light text-white">Our Private Feed</h1>
        <p className="text-xs sm:text-sm text-[#777777] font-light">
          A synchronized chronicle of posts, thoughts, and memories for our eyes only
        </p>
      </div>

      {/* Composer Card */}
      <div className="clay-card p-5 rounded-3xl border border-white/10 bg-[#0F0F0F] space-y-3 shadow-md">
        <div className="flex items-center gap-3">
          <img
            src={user.avatar}
            alt={user.name}
            className="h-10 w-10 rounded-full object-cover border border-white/20"
          />
          <input
            type="text"
            value={newPostContent}
            onChange={e => setNewPostContent(e.target.value)}
            placeholder="Share a thought, picture, or memory..."
            className="clay-input flex-1 h-11 px-4 text-xs sm:text-sm text-white placeholder-[#666666]"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newPostPhoto}
              onChange={e => setNewPostPhoto(e.target.value)}
              placeholder="Paste Image URL (optional)..."
              className="clay-input h-8 w-48 px-3 text-xs placeholder-[#666666]"
            />
          </div>

          <button
            onClick={handleCreatePost}
            disabled={!newPostContent.trim() && !newPostPhoto.trim()}
            className="clay-btn clay-btn-primary px-5 py-2 text-xs font-medium"
          >
            Post to Us
          </button>
        </div>
      </div>

      {/* Posts Stream */}
      <div className="space-y-6">
        {posts.map(post => {
          const isLiked = post.likes.includes(user.id);

          return (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="clay-card rounded-3xl overflow-hidden border border-white/10 bg-[#0F0F0F] shadow-xl"
            >
              {/* Header */}
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={post.authorAvatar}
                    alt={post.authorName}
                    className="h-10 w-10 rounded-full object-cover border border-white/20"
                  />
                  <div>
                    <h4 className="font-serif text-sm text-white font-normal">{post.authorName}</h4>
                    <p className="text-[11px] font-mono text-[#777777]">{formatDate(post.date, 'medium')}</p>
                  </div>
                </div>

                {post.location && (
                  <span className="text-[11px] font-mono text-[#777777] flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {post.location}
                  </span>
                )}
              </div>

              {/* Media if present */}
              {post.mediaUrls && post.mediaUrls.length > 0 && (
                <div className="relative max-h-[480px] w-full bg-black">
                  <img
                    src={post.mediaUrls[0]}
                    alt="Post media"
                    onClick={() => openMediaViewer(post.mediaUrls, 0, { description: post.content })}
                    className="max-h-[480px] w-full object-cover grayscale hover:grayscale-0 transition-all duration-500 cursor-pointer"
                  />
                </div>
              )}

              {/* Music badge if attached */}
              {post.song && (
                <div className="mx-5 my-3 p-3 rounded-2xl bg-[#161616] border border-white/10 flex items-center gap-3">
                  <Music className="h-4 w-4 text-white" />
                  <span className="text-xs text-white font-serif">{post.song.title} — {post.song.artist}</span>
                </div>
              )}

              {/* Content caption */}
              {post.content && (
                <div className="p-5 pt-3">
                  <p className="text-xs sm:text-sm text-[#CCCCCC] font-light leading-relaxed">
                    {post.content}
                  </p>
                </div>
              )}

              {/* Actions bar */}
              <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between text-xs text-[#777777]">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleToggleLike(post.id)}
                    className="flex items-center gap-1.5 text-[#AAAAAA] hover:text-white transition-colors"
                  >
                    <Heart className={`h-4 w-4 ${isLiked ? 'fill-white text-white' : ''}`} />
                    <span>{post.likes.length} Loved</span>
                  </button>

                  <span className="flex items-center gap-1.5 text-[#AAAAAA]">
                    <MessageCircle className="h-4 w-4" />
                    <span>{post.comments.length} Comments</span>
                  </span>
                </div>
              </div>

              {/* Comments list */}
              {post.comments && post.comments.length > 0 && (
                <div className="bg-[#0A0A0A] p-5 border-t border-white/5 space-y-2.5">
                  {post.comments.map(c => (
                    <div key={c.id} className="flex items-start gap-2.5">
                      <img
                        src={c.userAvatar}
                        alt={c.userName}
                        className="h-6 w-6 rounded-full object-cover border border-white/15 shrink-0 mt-0.5"
                      />
                      <div className="text-xs">
                        <span className="font-serif text-white mr-1.5">{c.userName}:</span>
                        <span className="text-[#AAAAAA] font-light">{c.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add comment row */}
              <div className="p-3 bg-[#0A0A0A] border-t border-white/5 flex items-center gap-2">
                <input
                  type="text"
                  value={commentInputs[post.id] || ''}
                  onChange={e => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddComment(post.id);
                  }}
                  placeholder="Write a sweet comment..."
                  className="clay-input flex-1 h-9 px-3 text-xs placeholder-[#555555]"
                />
                <button
                  onClick={() => handleAddComment(post.id)}
                  className="clay-btn clay-btn-secondary h-9 px-3 text-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}
