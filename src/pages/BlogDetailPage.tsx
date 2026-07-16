/**
 * BlogDetailPage — Renders a single blog post by slug.
 * Graceful 404 if post not found.
 *
 * To connect Supabase:
 *   Replace static lookup with:
 *   const { data: post } = await supabase.from('blog_posts').select('*, body').eq('slug', slug).eq('locale', lang).single()
 */
import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { blogData } from "@/data/blog.data";
import { blogStrings } from "@/content/content";
import BlogArticleBody from "@/sections/blog/BlogArticleBody";
import CTABanner from "@/components/ui/CTABanner";
import Tag from "@/components/ui/Tag";

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { lang, dir } = useLanguage();
  const data = blogData[lang];
  const str = blogStrings[lang];

  const post = data.posts.find((p) => p.slug === slug);

  const relatedPosts = post?.relatedSlugs
    ? data.posts.filter((p) => post.relatedSlugs?.includes(p.slug)).slice(0, 3)
    : data.posts.filter((p) => p.slug !== slug && p.category === post?.category).slice(0, 3);

  useEffect(() => {
    document.title = post ? `${post.title} | SHELAN Nutrition` : "Post Not Found | SHELAN Nutrition";
  }, [post]);

  // 404 state
  if (!post) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-6 text-center py-32">
        <p className="text-6xl font-heading font-bold text-primary-pink">404</p>
        <h1 className="font-heading text-2xl font-bold text-heading">Article Not Found</h1>
        <p className="text-body opacity-70">This article doesn't exist or has been removed.</p>
        <Link
          to="/blog"
          className="px-7 py-3 rounded-full bg-gradient-to-r from-primary-pink to-lavender-purple text-white font-semibold shadow-md hover:shadow-lg transition-shadow"
        >
          {str.backToBlog}
        </Link>
      </div>
    );
  }

  const breadcrumbs = [
    { label: lang === "ar" ? "الرئيسية" : "Home", href: "/" },
    { label: lang === "ar" ? "المدونة" : "Blog", href: "/blog" },
    { label: post.title },
  ];

  const ctaData = {
    kicker: lang === "ar" ? "ابدأي الآن" : "Take Action",
    headline:
      lang === "ar" ? "جاهزة لتطبيق ما تعلمتِه؟" : "Ready to Put This Into Practice?",
    description:
      lang === "ar"
        ? "ابدأي باستشارة شخصية وضعي هذه المبادئ موضع التنفيذ في خطة مبنية خصيصاً لجسمكِ."
        : "Start with a personalized consultation and put these principles into a plan built specifically for your body.",
    buttonLabel: lang === "ar" ? "احجزي استشارتكِ" : "Book Your Consultation",
    buttonHref: "/booking",
  };

  return (
    <>
      {/* Article hero */}
      <div className={`relative pt-36 pb-20 overflow-hidden bg-gradient-to-br ${post.accentFrom} ${post.accentTo} section-dark`}>
        <div className="absolute inset-0 bg-black/25" />
        <div className="absolute -top-24 -end-24 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-6 lg:px-10">
          {/* Breadcrumb */}
          <nav className="flex flex-wrap items-center gap-1 mb-6">
            {breadcrumbs.map((item, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-white/30 text-xs mx-0.5">›</span>}
                {item.href ? (
                  <Link to={item.href} className="text-xs text-white/60 hover:text-white transition-colors">{item.label}</Link>
                ) : (
                  <span className="text-xs text-white/85 line-clamp-1 max-w-[200px]">{item.label}</span>
                )}
              </span>
            ))}
          </nav>

          <Tag variant="ghost" className="mb-4">{post.category}</Tag>

          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
            {post.title}
          </h1>

          <p className="text-white/85 text-lg leading-relaxed max-w-2xl">{post.excerpt}</p>
        </div>
      </div>

      <BlogArticleBody
        post={post}
        relatedPosts={relatedPosts}
        strings={{
          minReadLabel: str.minReadLabel,
          byLabel: str.byLabel,
          tocTitle: str.tocTitle,
          relatedTitle: str.relatedTitle,
          readMoreLabel: str.readMoreLabel,
          backToBlog: str.backToBlog,
          publishedLabel: str.publishedLabel,
        }}
        dir={dir}
      />

      <CTABanner {...ctaData} />
    </>
  );
}
