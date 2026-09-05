import React, { useState, useMemo } from 'react';
import { LibraryArticle } from '../types';
import {
  Search,
  AlertTriangle,
  ArrowRight,
  Bookmark,
  Clock,
  Play,
  PlayCircle,
  Sprout,
  Bug,
  Recycle,
  Landmark,
  Droplets,
  FlaskConical,
  Filter,
} from 'lucide-react';

interface LibraryViewProps {
  articles: LibraryArticle[];
  onSelectArticle: (article: LibraryArticle) => void;
  onOpenMitigationProtocol: () => void;
  onToggleBookmark: (articleId: string) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All Topics' },
  { id: 'crops', label: 'Crops', icon: Sprout },
  { id: 'pests', label: 'Pests & Diseases', icon: Bug },
  { id: 'soil', label: 'Soil Health', icon: FlaskConical },
  { id: 'irrigation', label: 'Irrigation', icon: Droplets },
  { id: 'schemes', label: 'Gov Schemes', icon: Landmark },
];

export const LibraryView: React.FC<LibraryViewProps> = ({
  articles,
  onSelectArticle,
  onOpenMitigationProtocol,
  onToggleBookmark,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Filter articles based on search and category
  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      const matchesSearch =
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.category.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'crops' && art.categoryType === 'cultivation') return true;
      if (selectedCategory === 'pests' && art.categoryType === 'disease') return true;
      if (selectedCategory === 'soil' && art.categoryType === 'cultivation') return true;
      if (selectedCategory === 'irrigation' && art.categoryType === 'weather') return true;
      return true;
    });
  }, [articles, searchQuery, selectedCategory]);

  return (
    <div className="flex flex-col w-full pb-32 max-w-xl mx-auto px-5 py-4 gap-6 animate-in fade-in duration-300">
      {/* Red Outbreak Alert Banner (Screenshot 10) */}
      <section>
        <div className="bg-[#ffdad6] text-[#93000a] rounded-3xl p-5 flex items-start gap-4 shadow-sm relative overflow-hidden border border-[#ffdad6]">
          <div className="absolute -right-4 -top-4 w-28 h-28 bg-[#ba1a1a] opacity-10 rounded-full blur-xl pointer-events-none" />
          <div className="flex-shrink-0 w-11 h-11 bg-[#ba1a1a]/15 rounded-full flex items-center justify-center text-[#ba1a1a]">
            <AlertTriangle className="w-6 h-6 stroke-[2.5px]" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-[#93000a] mb-1">Local Outbreak Alert</h3>
            <p className="text-xs text-[#93000a]/90 leading-relaxed font-medium">
              Warning: High risk of Fall Armyworm detected in Sector 4 corn fields. Immediate scouting recommended.
            </p>
            <button
              onClick={onOpenMitigationProtocol}
              className="mt-3 px-4 py-2 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-full text-xs font-bold shadow-sm transition-transform active:scale-95 inline-flex items-center gap-1.5"
            >
              <span>View Mitigation Protocol</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Search Bar (Screenshot 12) */}
      <section>
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#717973] w-5 h-5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guides, schemes, and more..."
            className="w-full h-13 pl-12 pr-4 bg-white rounded-full border border-[#e1e3e4] text-sm text-[#191c1d] placeholder:text-[#717973] focus:outline-none focus:border-[#012d1d] focus:ring-4 focus:ring-[#012d1d]/10 transition-all shadow-[0_10px_25px_-5px_rgba(27,67,50,0.04)] font-medium"
          />
        </div>
      </section>

      {/* Browse Topics Grid (Screenshot 12) */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-[#012d1d]">Browse Topics</h2>
        <div className="grid grid-cols-2 gap-3">
          {/* Crop Guides */}
          <button
            onClick={() => setSelectedCategory('crops')}
            className="flex flex-col p-4 bg-white rounded-2xl shadow-[0_10px_25px_-5px_rgba(27,67,50,0.06)] border border-[#e1e3e4]/80 text-left transition-transform active:scale-95 group relative overflow-hidden"
          >
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-[#c1ecd4]/30 rounded-full group-hover:scale-125 transition-transform" />
            <Sprout className="w-7 h-7 text-[#2c694e] mb-2 relative z-10" />
            <span className="text-sm font-bold text-[#191c1d] relative z-10">Crop Guides</span>
          </button>

          {/* Pest Control */}
          <button
            onClick={() => setSelectedCategory('pests')}
            className="flex flex-col p-4 bg-white rounded-2xl shadow-[0_10px_25px_-5px_rgba(27,67,50,0.06)] border border-[#e1e3e4]/80 text-left transition-transform active:scale-95 group relative overflow-hidden"
          >
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-[#ffdad6]/50 rounded-full group-hover:scale-125 transition-transform" />
            <Bug className="w-7 h-7 text-[#ba1a1a] mb-2 relative z-10" />
            <span className="text-sm font-bold text-[#191c1d] relative z-10">Pest Control</span>
          </button>

          {/* Organic Farming */}
          <button
            onClick={() => setSelectedCategory('soil')}
            className="flex flex-col p-4 bg-white rounded-2xl shadow-[0_10px_25px_-5px_rgba(27,67,50,0.06)] border border-[#e1e3e4]/80 text-left transition-transform active:scale-95 group relative overflow-hidden"
          >
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-[#a0f4c8]/30 rounded-full group-hover:scale-125 transition-transform" />
            <Recycle className="w-7 h-7 text-[#00452d] mb-2 relative z-10" />
            <span className="text-sm font-bold text-[#191c1d] relative z-10">Organic Farming</span>
          </button>

          {/* Government Schemes */}
          <button
            onClick={() => setSelectedCategory('schemes')}
            className="flex flex-col p-4 bg-white rounded-2xl shadow-[0_10px_25px_-5px_rgba(27,67,50,0.06)] border border-[#e1e3e4]/80 text-left transition-transform active:scale-95 group relative overflow-hidden"
          >
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-[#c1ecd4]/20 rounded-full group-hover:scale-125 transition-transform" />
            <Landmark className="w-7 h-7 text-[#012d1d] mb-2 relative z-10" />
            <span className="text-sm font-bold text-[#191c1d] relative z-10">Government Schemes</span>
          </button>
        </div>
      </section>

      {/* Filter Chips Horizontal Scroll (Screenshot 10) */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#191c1d]">Explore Library</h2>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-xs font-semibold text-[#2c694e] hover:underline"
            >
              Reset Filter
            </button>
          )}
        </div>

        <div className="flex overflow-x-auto gap-2.5 pb-1 -mx-5 px-5 snap-x no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`snap-start shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#012d1d] text-white shadow-md'
                    : 'bg-[#edeeef] text-[#414844] hover:bg-[#e1e3e4]'
                }`}
              >
                {cat.icon && <cat.icon className="w-3.5 h-3.5" />}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Educational Article Cards (Screenshot 10) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredArticles.length === 0 ? (
          <div className="col-span-full py-12 text-center text-[#717973] bg-white rounded-3xl border border-dashed border-[#c1c8c2]">
            <p className="text-sm font-semibold">No guides found for "{searchQuery}"</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-2 text-xs text-[#012d1d] font-bold underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredArticles.map((article) => (
            <article
              key={article.id}
              onClick={() => onSelectArticle(article)}
              className="bg-white rounded-3xl shadow-[0_8px_24px_-4px_rgba(27,67,50,0.06)] border border-[#e1e3e4]/80 overflow-hidden flex flex-col group cursor-pointer transition-all hover:shadow-lg active:scale-[0.98]"
            >
              <div className="h-44 w-full relative overflow-hidden">
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#a0f4c8]/90 backdrop-blur-md text-[#002113] px-3 py-1 rounded-full text-[11px] font-bold shadow-sm">
                  {article.category}
                </div>

                {/* Bookmark button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleBookmark(article.id);
                  }}
                  className="absolute bottom-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all text-[#012d1d]"
                  title={article.isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
                >
                  <Bookmark
                    className={`w-4 h-4 ${article.isBookmarked ? 'fill-[#012d1d] text-[#012d1d]' : 'text-[#414844]'}`}
                  />
                </button>

                {article.isVideo && (
                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 text-[#012d1d] fill-[#012d1d] ml-0.5" />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#191c1d] group-hover:text-[#2c694e] transition-colors leading-snug mb-1.5">
                    {article.title}
                  </h3>
                  <p className="text-xs text-[#414844] line-clamp-2 leading-relaxed">
                    {article.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-[#717973] pt-2 border-t border-[#f3f4f5]">
                  <span className="flex items-center gap-1.5">
                    {article.isVideo ? (
                      <PlayCircle className="w-3.5 h-3.5 text-[#2c694e]" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-[#2c694e]" />
                    )}
                    <span>{article.readTime}</span>
                  </span>
                  <span className="flex items-center gap-1 text-[#012d1d] group-hover:translate-x-0.5 transition-transform font-bold">
                    <span>{article.isVideo ? 'Watch' : 'Read'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
};
