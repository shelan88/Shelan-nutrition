/**
 * BlogArticleBody — Renders structured article content from CMSArticleSection[].
 * Also includes sidebar (ToC + related posts).
 * Props-only, CMS-ready.
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Calendar, ArrowLeft, ArrowRight, Quote } from "lucide-react";
import { Link } from "react-router-dom";
import Tag from "@/components/ui/Tag";
import type { CMSBlogPost, CMSArticleSection } from "@/types/cms.types";

// ── Article renderer ──────────────────────────────────────────────────────────

function ArticleSection({ section }: { section: CMSArticleSection }) {
  switch (section.type) {
    case "heading2":
      return (
        <h2 id={section.content.toLowerCase().replace(/\s+/g, "-")} className="font-heading text-2xl font-bold text-heading mt-10 mb-4 scroll-mt-32">
          {section.content}
        </h2>
      );
    case "heading3":
      return (
        <h3 id={section.content.toLowerCase().replace(/\s+/g, "-")} className="font-heading text-xl font-bold text-heading mt-8 mb-3 scroll-mt-32">
          {section.content}
        </h3>
      );
    case "paragraph":
      return <p className="text-body leading-[1.85] mb-5 opacity-85">{section.content}</p>;
    case "list":
      return (
        <div className="mb-6">
          {section.content && (
            <p className="text-body leading-relaxed mb-3 font-medium">{section.content}</p>
          )}
          <ul className="space-y-2.5">
            {section.items?.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-primary-pink/15 flex items-center justify-center mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-pink" />
                </span>
                <span className="text-body text-sm leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    case "quote":
      return (
        <blockquote className="my-8 relative px-7 py-6 rounded-2xl bg-gradient-to-br from-primary-pink/8 to-lavender-purple/8 border-s-4 border-primary-pink">
          <Quote size={20} className="text-primary-pink/40 mb-3" />
          <p className="text-heading font-medium leading-relaxed italic">{section.content}</p>
        </blockquote>
      );
    case "image":
      return (
        <figure className="my-8">
          {section.imageUrl && (
            <img src={section.imageUrl} alt={section.imageAlt ?? ""} className="w-full rounded-2xl shadow-lg" />
          )}
          {section.caption && (
            <figcaption className="text-xs text-center text-deep-purple/40 mt-3">{section.caption}</figcaption>
          )}
        </figure>
      );
    default:
      return null;
  }
}

// ── Table of Contents ─────────────────────────────────────────────────────────

function TableOfContents({ sections, tocTitle }: { sections: CMSArticleSection[]; tocTitle: string }) {
  const headings = sections.filter((s) => s.type === "heading2" || s.type === "heading3");
  const [active, setActive] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-120px 0px -60% 0px" }
    );
    headings.forEach((h) => {
      const el = document.getElementById(h.content.toLowerCase().replace(/\s+/g, "-"));
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className="sticky top-32 bg-white rounded-2xl border border-soft-purple/12 p-6 shadow-md shadow-deep-purple/8">
      <h3 className="font-heading text-sm font-bold text-heading mb-4 uppercase tracking-wider">
        {tocTitle}
      </h3>
      <ul className="space-y-2">
        {headings.map((h, i) => {
          const id = h.content.toLowerCase().replace(/\s+/g, "-");
          return (
            <li key={i} className={h.type === "heading3" ? "ps-3" : ""}>
              <a
                href={`#${id}`}
                className={`text-sm leading-snug transition-colors block py-0.5 ${
                  active === id
                    ? "text-primary-pink font-semibold"
                    : "text-deep-purple/55 hover:text-primary-pink"
                }`}
              >
                {h.content}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// ── Related posts strip ───────────────────────────────────────────────────────

function RelatedPosts({
  posts,
  relatedTitle,
  readMoreLabel,
  minReadLabel,
}: {
  posts: CMSBlogPost[];
  relatedTitle: string;
  readMoreLabel: string;
  minReadLabel: string;
}) {
  if (!posts.length) return null;
  return (
    <section className="py-16 border-t border-soft-purple/12">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <h2 className="font-heading text-2xl font-bold text-heading mb-8">{relatedTitle}</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              className="group bg-white rounded-2xl border border-soft-purple/12 overflow-hidden shadow-sm hover:shadow-lg hover:shadow-deep-purple/10 hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`h-32 bg-gradient-to-br ${post.accentFrom} ${post.accentTo}`} />
              <div className="p-5">
                <Tag variant="primary" className="mb-3">{post.category}</Tag>
                <h3 className="font-heading text-sm font-bold text-heading mb-2 line-clamp-2">{post.title}</h3>
                <div className="flex items-center justify-between mt-3">
                  <span className="flex items-center gap-1 text-xs text-deep-purple/40">
                    <Clock size={11} /> {post.readTimeMinutes} {minReadLabel}
                  </span>
                  <Link to={`/blog/${post.slug}`} className="text-xs font-semibold text-primary-pink hover:text-deep-purple transition-colors">
                    {readMoreLabel} →
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

interface Props {
  post: CMSBlogPost;
  relatedPosts: CMSBlogPost[];
  strings: {
    minReadLabel: string;
    byLabel: string;
    tocTitle: string;
    relatedTitle: string;
    readMoreLabel: string;
    backToBlog: string;
    publishedLabel: string;
  };
  dir: "ltr" | "rtl";
}

export default function BlogArticleBody({ post, relatedPosts, strings, dir }: Props) {
  const body = post.body ?? [];

  const formattedDate = new Date(post.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const BackArrow = dir === "rtl" ? ArrowRight : ArrowLeft;

  return (
    <>
      {/* Article */}
      <article className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-[1fr_280px] gap-12 xl:gap-16 items-start">
            {/* Main column */}
            <div>
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-sm text-primary-pink font-medium hover:text-deep-purple transition-colors mb-8"
              >
                <BackArrow size={15} className="rtl:rotate-180" />
                {strings.backToBlog}
              </Link>

              {/* Author + meta */}
              <div className="flex flex-wrap items-center gap-4 mb-8 pb-8 border-b border-soft-purple/12">
                <img
                  src={post.author.avatarUrl}
                  alt={post.author.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-light-pink"
                />
                <div>
                  <p className="text-sm font-semibold text-heading">{post.author.name}</p>
                  <p className="text-xs text-deep-purple/50">{post.author.bio}</p>
                </div>
                <div className="ms-auto flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1.5 text-xs text-deep-purple/45">
                    <Calendar size={12} /> {strings.publishedLabel} {formattedDate}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-deep-purple/45">
                    <Clock size={12} /> {post.readTimeMinutes} {strings.minReadLabel}
                  </span>
                  <Tag variant="primary">{post.category}</Tag>
                </div>
              </div>

              {/* Body */}
              <div className="prose-custom">
                {body.map((section, i) => (
                  <ArticleSection key={i} section={section} />
                ))}
              </div>

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="mt-10 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Tag key={tag} variant="outline">{tag}</Tag>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="hidden lg:block">
              <TableOfContents sections={body} tocTitle={strings.tocTitle} />
            </aside>
          </div>
        </div>
      </article>

      {/* Related posts */}
      <div className="bg-light-pink/15">
        <RelatedPosts
          posts={relatedPosts}
          relatedTitle={strings.relatedTitle}
          readMoreLabel={strings.readMoreLabel}
          minReadLabel={strings.minReadLabel}
        />
      </div>
    </>
  );
}
