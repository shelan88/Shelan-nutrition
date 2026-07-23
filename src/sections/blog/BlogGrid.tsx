/**
 * BlogGrid — Search bar, category tabs, blog cards, pagination.
 * Search and category are UI-only local state; ready for backend params.
 * Props-only for data, CMS-ready.
 */
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Clock, Calendar, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import Tag from "@/components/ui/Tag";
import type { CMSBlogPost } from "@/types/cms.types";
import { useLanguage } from "@/context/LanguageContext";

const POSTS_PER_PAGE = 6;

interface Props {
  posts: CMSBlogPost[];
  categories: string[];
  searchPlaceholder: string;
  readMoreLabel: string;
  minReadLabel: string;
  noPosts: string;
  prevLabel: string;
  nextLabel: string;
}

function BlogCard({
  post,
  readMoreLabel,
  minReadLabel,
  index,
}: {
  post: CMSBlogPost;
  readMoreLabel: string;
  minReadLabel: string;
  index: number;
}) {
  const { lang } = useLanguage();
  const dateLocale = lang === "ar" ? "ar-SA" : "en-US";
  const formattedDate = new Date(post.publishedAt).toLocaleDateString(dateLocale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay: (index % POSTS_PER_PAGE) * 0.07 }}
      className="group bg-white rounded-2xl overflow-hidden border border-soft-purple/12 shadow-md shadow-deep-purple/8 hover:shadow-xl hover:shadow-deep-purple/15 hover:-translate-y-1 transition-all duration-300 flex flex-col"
    >
      {/* Gradient thumbnail */}
      <div
        className={`relative h-44 bg-gradient-to-br ${post.accentFrom} ${post.accentTo} overflow-hidden shrink-0`}
      >
        <div className="absolute inset-0 bg-black/8" />
        <div className="absolute -bottom-6 -end-6 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute top-4 start-4">
          <Tag variant="ghost">{post.category}</Tag>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-3">
          <span className="flex items-center gap-1 text-xs text-deep-purple/45">
            <Calendar size={11} />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1 text-xs text-deep-purple/45">
            <Clock size={11} />
            {post.readTimeMinutes} {minReadLabel}
          </span>
        </div>

        <h3 className="font-heading text-base font-bold text-heading mb-2 leading-snug line-clamp-2 flex-1">
          {post.title}
        </h3>

        <p className="text-body text-sm leading-relaxed mb-5 opacity-75 line-clamp-2">
          {post.excerpt}
        </p>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2.5">
            <img
              src={post.author.avatarUrl}
              alt={post.author.name}
              className="w-7 h-7 rounded-full object-cover border border-light-pink"
            />
            <span className="text-xs font-medium text-deep-purple/60">{post.author.name}</span>
          </div>
          <Link
            to={`/blog/${post.slug}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary-pink hover:text-deep-purple transition-colors group/link"
          >
            {readMoreLabel}
            <ArrowRight size={12} className="group-hover/link:translate-x-0.5 rtl:rotate-180 rtl:group-hover/link:-translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

export default function BlogGrid({
  posts,
  categories,
  searchPlaceholder,
  readMoreLabel,
  minReadLabel,
  noPosts,
  prevLabel,
  nextLabel,
}: Props) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(categories[0] ?? "All");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const matchCat =
        activeCategory === categories[0] || p.category === activeCategory;
      const matchSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.excerpt.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [posts, activeCategory, categories, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE));
  const pagePosts = filtered.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setPage(1);
  };

  return (
    <section className="py-16 pb-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Search + Categories */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute start-4 top-1/2 -translate-y-1/2 text-deep-purple/35 pointer-events-none"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={searchPlaceholder}
              className="w-full ps-10 pe-4 py-3 rounded-full border border-soft-purple/20 bg-light-pink/15 text-sm text-heading placeholder:text-deep-purple/35 focus:outline-none focus:border-primary-pink/50 focus:ring-2 focus:ring-primary-pink/15 transition-all"
            />
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                  activeCategory === cat
                    ? "bg-primary-pink text-white shadow-md shadow-primary-pink/25"
                    : "bg-light-pink/30 text-deep-purple hover:bg-light-pink/60"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {pagePosts.length === 0 ? (
          <p className="text-center text-body opacity-60 py-16">{noPosts}</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {pagePosts.map((post, i) => (
              <BlogCard
                key={post.id}
                post={post}
                readMoreLabel={readMoreLabel}
                minReadLabel={minReadLabel}
                index={i}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-10 h-10 rounded-full border border-soft-purple/20 flex items-center justify-center text-deep-purple hover:bg-light-pink/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label={prevLabel}
            >
              <ChevronLeft size={18} className="rtl:rotate-180" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-10 h-10 rounded-full text-sm font-semibold transition-all ${
                  n === page
                    ? "bg-primary-pink text-white shadow-md shadow-primary-pink/25"
                    : "border border-soft-purple/20 text-deep-purple hover:bg-light-pink/30"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-10 h-10 rounded-full border border-soft-purple/20 flex items-center justify-center text-deep-purple hover:bg-light-pink/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label={nextLabel}
            >
              <ChevronRight size={18} className="rtl:rotate-180" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
