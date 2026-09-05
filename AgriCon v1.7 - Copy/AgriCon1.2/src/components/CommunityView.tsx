import React, { useState } from 'react';
import { ForumPost, MarketItem } from '../types';
import {
  Camera,
  Mic,
  ThumbsUp,
  MessageSquare,
  Bookmark,
  Share2,
  Send,
  Search,
  SlidersHorizontal,
  MapPin,
  Sparkles,
  ChevronDown,
  UserCheck,
  CheckCircle,
  HelpCircle,
  Tag,
  IndianRupee,
} from 'lucide-react';

export const formatPriceToInr = (price: string): string => {
  if (!price) return '';
  // Convert any dollar amounts into Indian Rupee at realistic exchange rate (~₹83)
  if (price.includes('$')) {
    return price.replace(/\$\s*([\d,]+(\.\d+)?)/g, (_, num) => {
      const numericVal = parseFloat(num.replace(/,/g, ''));
      if (isNaN(numericVal)) return '₹';
      const inrVal = Math.round(numericVal * 83);
      return `₹${inrVal.toLocaleString('en-IN')}`;
    });
  }
  return price;
};

interface CommunityViewProps {
  posts: ForumPost[];
  marketItems: MarketItem[];
  onLikePost: (postId: string) => void;
  onBookmarkPost: (postId: string) => void;
  onAddPost: (title: string, content: string, tag: string) => void;
  onAddReply: (postId: string, text: string) => void;
  onOpenConsultExpert: () => void;
  onContactSeller: (item: MarketItem) => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  posts,
  marketItems,
  onLikePost,
  onBookmarkPost,
  onAddPost,
  onAddReply,
  onOpenConsultExpert,
  onContactSeller,
}) => {
  const [activeTab, setActiveTab] = useState<'ask' | 'market'>('ask');
  const [newPostText, setNewPostText] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [selectedTag, setSelectedTag] = useState('Soil Health');
  const [showNewPostForm, setShowNewPostForm] = useState(false);

  // Reply drawer state
  const [activeReplyingPostId, setActiveReplyingPostId] = useState<string | null>(null);
  const [replyInputText, setReplyInputText] = useState('');

  // Market filter
  const [marketSearch, setMarketSearch] = useState('');
  const [selectedMarketCategory, setSelectedMarketCategory] = useState('All');
  const MARKET_CATEGORIES = ['All', 'Fertilizer & Soil', 'Machinery', 'Seeds', 'Irrigation'];

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;
    const title = newPostTitle.trim() || newPostText.slice(0, 45) + '...';
    onAddPost(title, newPostText, selectedTag);
    setNewPostText('');
    setNewPostTitle('');
    setShowNewPostForm(false);
  };

  const handleSendReply = (postId: string) => {
    if (!replyInputText.trim()) return;
    onAddReply(postId, replyInputText);
    setReplyInputText('');
  };

  const filteredMarketItems = marketItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(marketSearch.toLowerCase()) ||
      item.description.toLowerCase().includes(marketSearch.toLowerCase()) ||
      item.location.toLowerCase().includes(marketSearch.toLowerCase());
    const matchesCategory =
      selectedMarketCategory === 'All' || item.category === selectedMarketCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col w-full pb-32 max-w-xl mx-auto px-5 py-4 gap-6 animate-in fade-in duration-300">
      {/* Segmented Tab: Ask People vs Agri Market (Screenshot 14) */}
      <div className="flex bg-[#edeeef] rounded-full p-1 w-full">
        <button
          onClick={() => setActiveTab('ask')}
          className={`flex-1 rounded-full py-2.5 text-xs font-bold transition-all ${
            activeTab === 'ask'
              ? 'bg-[#012d1d] text-white shadow-sm'
              : 'text-[#414844] hover:text-[#012d1d]'
          }`}
        >
          Ask People
        </button>
        <button
          onClick={() => setActiveTab('market')}
          className={`flex-1 rounded-full py-2.5 text-xs font-bold transition-all ${
            activeTab === 'market'
              ? 'bg-[#012d1d] text-white shadow-sm'
              : 'text-[#414844] hover:text-[#012d1d]'
          }`}
        >
          Agri Market
        </button>
      </div>

      {activeTab === 'ask' ? (
        <div className="flex flex-col gap-6">
          {/* Community Knowledge Hub Header Banner */}
          <section>
            <div className="relative w-full rounded-3xl overflow-hidden bg-[#012d1d] shadow-[0_10px_25px_-5px_rgba(27,67,50,0.15)] border border-[#2c694e]/30">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00452d]/50 via-transparent to-[#1b4332]/90 z-0" />
              <div className="absolute top-0 right-0 w-36 h-36 bg-[#a0f4c8] opacity-15 rounded-full blur-3xl -mt-10 -mr-10 z-0 pointer-events-none" />
              <div className="absolute bottom-0 left-1/4 w-28 h-28 bg-[#aeeecb] opacity-20 rounded-full blur-2xl -mb-6 z-0 pointer-events-none" />

              <div className="relative z-10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#a0f4c8] bg-white/10 w-fit px-2 py-0.5 rounded-full">
                    Grower Community
                  </span>
                  <h2 className="text-lg font-bold text-white tracking-tight">Farmer Community Forum</h2>
                  <p className="text-xs text-[#a5d0b9] leading-relaxed">
                    Share agronomic insights, soil tips, and disease solutions with local farmers in your district.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Create Post Input Card (Screenshot 14) */}
          <section className="bg-white rounded-3xl p-5 shadow-[0_10px_25px_-5px_rgba(27,67,50,0.08)] border border-[#e1e3e4]/80 flex flex-col gap-3">
            <div className="flex gap-3.5 items-start">
              <img
                alt="Alex Thorne"
                className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-[#c1ecd4]"
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80"
              />
              <div className="flex-1 flex flex-col gap-2">
                {showNewPostForm && (
                  <input
                    type="text"
                    placeholder="Subject line / Question title..."
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    className="w-full text-sm font-bold text-[#191c1d] placeholder:text-[#717973] border-b border-[#e1e3e4] pb-1.5 focus:outline-none focus:border-[#012d1d]"
                  />
                )}
                <textarea
                  value={newPostText}
                  onFocus={() => setShowNewPostForm(true)}
                  onChange={(e) => setNewPostText(e.target.value)}
                  placeholder="Ask the community a question about soil, crops, or machinery..."
                  className="w-full bg-transparent border-none text-sm text-[#191c1d] placeholder:text-[#717973] focus:ring-0 resize-none min-h-[48px] font-medium"
                  rows={showNewPostForm ? 3 : 2}
                />
              </div>
            </div>

            {showNewPostForm && (
              <div className="flex items-center gap-2 pt-1 border-t border-[#f3f4f5]">
                <span className="text-[11px] font-bold text-[#717973]">Topic:</span>
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="text-xs bg-[#edeeef] text-[#012d1d] font-bold px-2.5 py-1 rounded-full border-none focus:ring-0"
                >
                  <option>Soil Health</option>
                  <option>Yield</option>
                  <option>Equipment</option>
                  <option>Pest Control</option>
                  <option>Organic</option>
                </select>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-[#f3f4f5] pt-3">
              <div className="flex gap-2 text-[#2c694e]">
                <button
                  type="button"
                  onClick={() => alert('Photo attachment tool ready for camera snapshot.')}
                  className="p-2 bg-[#f3f4f5] hover:bg-[#edeeef] rounded-full transition-colors"
                  title="Attach Photo"
                >
                  <Camera className="w-4 h-4 text-[#012d1d]" />
                </button>
                <button
                  type="button"
                  onClick={() => alert('Voice note dictation ready.')}
                  className="p-2 bg-[#f3f4f5] hover:bg-[#edeeef] rounded-full transition-colors"
                  title="Voice Note"
                >
                  <Mic className="w-4 h-4 text-[#012d1d]" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                {showNewPostForm && (
                  <button
                    type="button"
                    onClick={() => setShowNewPostForm(false)}
                    className="text-xs font-semibold text-[#717973] px-3 py-1.5"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={handleCreatePost}
                  disabled={!newPostText.trim()}
                  className={`px-5 py-2 rounded-full text-xs font-bold shadow-sm transition-all ${
                    newPostText.trim()
                      ? 'bg-[#012d1d] hover:bg-[#1b4332] text-white active:scale-95'
                      : 'bg-[#edeeef] text-[#717973] cursor-not-allowed'
                  }`}
                >
                  Post
                </button>
              </div>
            </div>
          </section>

          {/* Local Forum Header & Filter (Screenshot 1) */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#191c1d]">Local Forum</h3>
              <div className="flex items-center gap-1.5 bg-[#edeeef] px-3.5 py-1.5 rounded-full text-xs font-bold text-[#012d1d]">
                <span>Recent</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feed Posts List */}
            <div className="flex flex-col gap-5">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="bg-white rounded-3xl p-5 shadow-[0_10px_25px_-5px_rgba(27,67,50,0.08)] border border-[#e1e3e4]/80 flex flex-col gap-3.5"
                >
                  {/* Post Header */}
                  <div className="flex items-center gap-3">
                    <img
                      src={post.author.avatarUrl}
                      alt={post.author.name}
                      className="w-10 h-10 rounded-full object-cover shrink-0 shadow-sm ring-1 ring-[#c1ecd4]"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-[#191c1d] truncate">{post.author.name}</h4>
                      <p className="text-[11px] text-[#717973] truncate">
                        {post.timeAgo} • {post.author.location}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        post.tagType === 'yield'
                          ? 'bg-[#a0f4c8]/30 text-[#005236]'
                          : post.tagType === 'success'
                          ? 'bg-[#aeeecb]/40 text-[#0e5138]'
                          : post.tagType === 'soil'
                          ? 'bg-[#c1ecd4]/50 text-[#002114]'
                          : 'bg-[#edeeef] text-[#414844]'
                      }`}
                    >
                      {post.tag}
                    </span>
                  </div>

                  {/* Post Body */}
                  <div className="flex flex-col gap-1.5">
                    <h5 className="text-base font-bold text-[#191c1d] leading-snug">{post.title}</h5>
                    <p className="text-xs text-[#414844] leading-relaxed">{post.content}</p>

                    {post.imageUrl && (
                      <div className="mt-2 w-full h-44 rounded-2xl overflow-hidden shadow-sm">
                        <img
                          src={post.imageUrl}
                          alt="Post media"
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 pt-2.5 border-t border-[#f3f4f5]">
                    <button
                      onClick={() => onLikePost(post.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                        post.isLiked
                          ? 'bg-[#c1ecd4] text-[#012d1d]'
                          : 'bg-[#f3f4f5] hover:bg-[#edeeef] text-[#414844]'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${post.isLiked ? 'fill-[#012d1d]' : ''}`} />
                      <span>{post.likes}</span>
                    </button>

                    <button
                      onClick={() =>
                        setActiveReplyingPostId(activeReplyingPostId === post.id ? null : post.id)
                      }
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                        activeReplyingPostId === post.id
                          ? 'bg-[#012d1d] text-white'
                          : 'bg-[#f3f4f5] hover:bg-[#edeeef] text-[#414844]'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{post.commentsCount + post.replies.length}</span>
                    </button>

                    <div className="flex-1" />

                    <button
                      onClick={() => onBookmarkPost(post.id)}
                      className="p-2 rounded-full text-[#717973] hover:bg-[#f3f4f5] transition-colors"
                      title="Bookmark Post"
                    >
                      <Bookmark className={`w-4 h-4 ${post.isBookmarked ? 'fill-[#012d1d] text-[#012d1d]' : ''}`} />
                    </button>

                    <button
                      onClick={() => alert('Post link copied to clipboard!')}
                      className="p-2 rounded-full text-[#717973] hover:bg-[#f3f4f5] transition-colors"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Replies Thread */}
                  {post.replies.length > 0 && (
                    <div className="flex flex-col gap-2 pt-2 border-t border-[#f3f4f5]">
                      {post.replies.map((rep) => (
                        <div key={rep.id} className="bg-[#f8f9fa] p-3 rounded-2xl flex gap-2.5 items-start">
                          <img
                            src={rep.avatarUrl}
                            alt={rep.author}
                            className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#191c1d]">{rep.author}</span>
                              <span className="text-[10px] text-[#717973]">{rep.timeAgo}</span>
                            </div>
                            <p className="text-xs text-[#414844] mt-0.5 leading-relaxed">{rep.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Active Reply Input */}
                  {activeReplyingPostId === post.id && (
                    <div className="flex gap-2 pt-2 border-t border-[#f3f4f5] animate-in fade-in duration-150">
                      <input
                        type="text"
                        placeholder="Write a reply..."
                        value={replyInputText}
                        onChange={(e) => setReplyInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendReply(post.id)}
                        className="flex-1 text-xs bg-[#f8f9fa] border border-[#e1e3e4] rounded-full px-3.5 py-2 text-[#191c1d] focus:outline-none focus:border-[#012d1d]"
                      />
                      <button
                        onClick={() => handleSendReply(post.id)}
                        className="p-2 bg-[#012d1d] hover:bg-[#1b4332] text-white rounded-full transition-transform active:scale-95"
                      >
                        <Send className="w-3.5 h-3.5 text-[#a0f4c8]" />
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : (
        /* Agri Market View (Screenshot 14) */
        <div className="flex flex-col gap-4">
          {/* Market Banner highlighting Indian Mandi & Agri Market (₹ INR) */}
          <div className="relative w-full rounded-2xl overflow-hidden bg-[#012d1d] p-4 text-white shadow-xs border border-[#2c694e]/30">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#a0f4c8] bg-white/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <IndianRupee className="w-3 h-3" />
                    <span>Agri Market &amp; Mandi</span>
                  </span>
                </div>
                <h3 className="text-sm font-black text-white mt-1">Farm Supplies &amp; Equipment</h3>
                <p className="text-[11px] text-[#a5d0b9]">
                  Local inputs, seeds, and machinery priced in Indian Rupee (₹ INR)
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-[#a0f4c8]/20 border border-[#a0f4c8]/30 flex items-center justify-center shrink-0">
                <IndianRupee className="w-5 h-5 text-[#a0f4c8]" />
              </div>
            </div>
          </div>

          {/* Market Search */}
          <div className="bg-white rounded-full p-2 pl-4 shadow-[0_10px_25px_-5px_rgba(27,67,50,0.08)] border border-[#e1e3e4] flex items-center gap-2">
            <Search className="w-5 h-5 text-[#717973]" />
            <input
              type="text"
              value={marketSearch}
              onChange={(e) => setMarketSearch(e.target.value)}
              placeholder="Search mandi supplies, machinery, seeds..."
              className="flex-1 bg-transparent border-none text-sm text-[#191c1d] placeholder:text-[#717973] focus:ring-0 font-medium"
            />
            <button
              onClick={() => alert('Filters: Distance < 25 km, Verified Sellers, Mandi Rates in ₹ INR')}
              className="p-2.5 bg-[#012d1d] hover:bg-[#1b4332] text-white rounded-full flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
              title="Filter listings"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#a0f4c8]" />
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {MARKET_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedMarketCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedMarketCategory === cat
                    ? 'bg-[#012d1d] text-white shadow-xs'
                    : 'bg-white border border-[#d8e8de] text-[#52796f] hover:bg-[#eef7f2]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Listings Grid */}
          <div className="grid grid-cols-2 gap-3.5">
            {filteredMarketItems.map((item) => {
              const formattedPrice = formatPriceToInr(item.price);
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl overflow-hidden shadow-[0_10px_25px_-5px_rgba(27,67,50,0.08)] border border-[#e1e3e4]/80 flex flex-col hover:border-[#a7e3b8] transition-colors"
                >
                  <div className="h-32 w-full relative">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {item.category}
                    </span>
                  </div>

                  <div className="p-3.5 flex flex-col gap-2 flex-1 justify-between">
                    <div>
                      <div className="flex flex-col gap-1">
                        <h4 className="text-xs font-bold text-[#191c1d] line-clamp-1">{item.title}</h4>
                        <div className="flex items-center">
                          <span className="text-xs font-black text-[#012d1d] bg-[#d8f3dc] px-2 py-0.5 rounded-md border border-[#a7e3b8] whitespace-nowrap">
                            {formattedPrice}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-[#717973] line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-[#f3f4f5]">
                      <span className="text-[10px] font-semibold text-[#717973] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#2c694e]" />
                        <span>{item.distance}</span>
                      </span>
                      <button
                        onClick={() => onContactSeller(item)}
                        className="text-xs font-bold text-[#012d1d] bg-[#c1ecd4] hover:bg-[#a0f4c8] rounded-full px-3 py-1 transition-all active:scale-95 cursor-pointer"
                      >
                        Contact
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
