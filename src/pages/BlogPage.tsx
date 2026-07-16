/**
 * BlogPage — Lists all blog posts with search, categories, and pagination.
 * Posts are fetched from Supabase; hero strings come from static data.
 */
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { blogData } from "@/data/blog.data";
import { blogStrings } from "@/content/content";
import { supabase } from "@/lib/supabase";
import type { BlogPostRow } from "@/types/database.types";
import type { CMSBlogPost } from "@/types/cms.types";
import PageHero from "@/components/ui/PageHero";
import BlogFeatured from "@/sections/blog/BlogFeatured";
import BlogGrid from "@/sections/blog/BlogGrid";
import CTABanner from "@/components/ui/CTABanner";

function mapPost(row: BlogPostRow, lang: string): CMSBlogPost {
  const d = (row.details as any) ?? {};
  const title = lang === "ar" ? (row.title_ar ?? row.title_en) : row.title_en;
  const excerpt = lang === "ar" ? (row.excerpt_ar ?? row.excerpt_en ?? "") : (row.excerpt_en ?? "");
  const content = lang === "ar" ? row.content_ar : row.content_en;
  const body = content
    ? content.split("\n\n").filter(Boolean).map(p => ({ type: "paragraph" as const, content: p.trim() }))
    : [];
  return {
    id: row.id,
    slug: row.slug,
    title,
    excerpt,
    accentFrom: d.accentFrom ?? "from-soft-purple",
    accentTo: d.accentTo ?? "to-lavender-purple",
    category: lang === "ar" ? (d.categoryAr ?? row.category ?? "عام") : (row.category ?? "General"),
    readTimeMinutes: row.read_time_minutes ?? 5,
    publishedAt: row.published_at ?? row.created_at,
    author: {
      name: row.author_name ?? "Shelan",
      avatarUrl: row.author_avatar ?? "/portrait.jpg",
      bio: lang === "ar" ? "أخصائية تغذية شمولية" : "Certified Holistic Nutritionist",
    },
    featured: d.featured ?? false,
    tags: row.tags ?? [],
    body,
  };
}

export default function BlogPage() {
  const { lang } = useLanguage();
  const data = blogData[lang];
  const str = blogStrings[lang];

  const [posts, setPosts] = useState<BlogPostRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = lang === "ar" ? "المدونة | SHELAN" : "Blog | SHELAN Nutrition";
  }, [lang]);

  useEffect(() => {
    setLoading(true);
    supabase
      .from("blog_posts")
      .select("*")
      .eq("published", true)
      .order("published_at", { ascending: false })
      .then(({ data: rows }) => {
        setPosts(rows ?? []);
        setLoading(false);
      });
  }, []);

  const mappedPosts = posts.map(p => mapPost(p, lang));

  const featuredPost = mappedPosts.find(p => p.featured);
  const regularPosts = mappedPosts.filter(p => !p.featured);

  const categories =
    lang === "ar"
      ? ["الكل", ...Array.from(new Set(mappedPosts.map(p => p.category)))]
      : ["All", ...Array.from(new Set(mappedPosts.map(p => p.category)))];

  const breadcrumbs = [
    { label: lang === "ar" ? "الرئيسية" : "Home", href: "/" },
    { label: lang === "ar" ? "المدونة" : "Blog" },
  ];

  const ctaData = {
    kicker: lang === "ar" ? "ابدأي رحلتكِ" : "Start Your Journey",
    headline: lang === "ar" ? "هل أنتِ مستعدة لتحول حقيقي؟" : "Ready for a Real Transformation?",
    description:
      lang === "ar"
        ? "المعرفة هي الخطوة الأولى. الخطوة التالية هي اتخاذ إجراء."
        : "Knowledge is the first step. The next step is taking action.",
    buttonLabel: lang === "ar" ? "احجزي استشارتكِ" : "Book Your Consultation",
    buttonHref: "/booking",
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary-pink/20 border-t-primary-pink rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <PageHero
        kicker={data.hero.kicker}
        headline={data.hero.headline}
        subheadline={data.hero.subheadline}
        breadcrumbs={breadcrumbs}
      />

      {featuredPost && (
        <BlogFeatured
          post={featuredPost}
          featuredLabel={str.featuredLabel}
          readMoreLabel={str.readMoreLabel}
          minReadLabel={str.minReadLabel}
          byLabel={str.byLabel}
        />
      )}

      <BlogGrid
        posts={regularPosts}
        categories={categories}
        searchPlaceholder={str.searchPlaceholder}
        readMoreLabel={str.readMoreLabel}
        minReadLabel={str.minReadLabel}
        noPosts={str.noPosts}
        prevLabel={str.prevLabel}
        nextLabel={str.nextLabel}
      />

      <CTABanner {...ctaData} />
    </>
  );
}
