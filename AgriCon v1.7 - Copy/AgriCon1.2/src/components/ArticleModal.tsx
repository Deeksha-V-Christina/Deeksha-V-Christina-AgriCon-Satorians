import React from 'react';
import { LibraryArticle } from '../types';
import { X, Clock, Bookmark, Share2, Play, CheckCircle2, ArrowLeft } from 'lucide-react';

interface ArticleModalProps {
  article: LibraryArticle | null;
  onClose: () => void;
  onToggleBookmark: (id: string) => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  article,
  onClose,
  onToggleBookmark,
}) => {
  if (!article) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-[#e1e3e4] flex flex-col max-h-[90vh]">
        {/* Header Media */}
        <div className="relative h-56 w-full">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/70 transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => onToggleBookmark(article.id)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/70 transition-all active:scale-95"
          >
            <Bookmark
              className={`w-4 h-4 ${article.isBookmarked ? 'fill-[#a0f4c8] text-[#a0f4c8]' : 'text-white'}`}
            />
          </button>

          <div className="absolute bottom-4 left-5 right-5">
            <span className="bg-[#a0f4c8] text-[#002113] text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-1.5 inline-block">
              {article.category}
            </span>
            <h2 className="text-lg font-bold text-white leading-tight">{article.title}</h2>
          </div>
        </div>

        {/* Article Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-4 text-xs text-[#414844] leading-relaxed no-scrollbar">
          <div className="flex items-center gap-4 text-[11px] font-semibold text-[#717973] border-b border-[#f3f4f5] pb-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#2c694e]" />
              <span>{article.readTime}</span>
            </span>
            <span>•</span>
            <span>Published by Agricon Field Research</span>
          </div>

          <p className="font-medium text-sm text-[#191c1d] leading-relaxed">
            {article.summary}
          </p>

          {article.sections ? (
            article.sections.map((sec, i) => (
              <div key={i} className="flex flex-col gap-1.5 mt-2">
                <h4 className="text-sm font-bold text-[#012d1d]">{sec.heading}</h4>
                <p className="text-xs text-[#414844] leading-relaxed">{sec.body}</p>
              </div>
            ))
          ) : (
            <p>
              Maintaining optimal soil structure and nutrient balance requires frequent monitoring of electrical conductivity (EC), organic matter turnover, and irrigation water hardness.
            </p>
          )}

          <div className="p-4 bg-[#c1ecd4]/25 rounded-2xl border border-[#c1ecd4] mt-3">
            <h5 className="font-bold text-[#012d1d] text-xs mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#2c694e]" />
              Key Takeaway for Field Operations:
            </h5>
            <p className="text-xs text-[#414844]">
              Conduct testing 2 weeks before major vegetative split application to calibrate exact granular nutrient dosage.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#f8f9fa] border-t border-[#e1e3e4] flex items-center justify-between">
          <button
            onClick={() => alert('Article guide link copied!')}
            className="flex items-center gap-1.5 text-xs font-bold text-[#414844] hover:text-[#012d1d]"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Guide</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#012d1d] text-white text-xs font-bold shadow-sm hover:bg-[#1b4332]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
