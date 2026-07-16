/**
 * BlogPage — Lists all blog posts with search, categories, and pagination.
 *
 * To connect Supabase:
 *   Replace `blogData[lang]` with supabase.from('blog_posts').select('*').eq('locale', lang).order('published_at', { ascending: false })
 */
import { useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { blogData } from "@/data/blog.data";
import { blogStrings } from "@/content/content";
import PageHero from "@/components/ui/PageHero";
import BlogFeatured from "@/sections/blog/BlogFeatured";
import BlogGrid from "@/sections/blog/BlogGrid";
import CTABanner from "@/components/ui/CTABanner";

export default function BlogPage() {
  const { lang } = useLanguage();
  const data = blogData[lang];
  const str = blogStrings[lang];

  useEffect(() => {
    document.title = lang === "ar" ? "المدونة | SHELAN" : "Blog | SHELAN Nutrition";
  }, [lang]);

  const featuredPost = data.posts.find((p) => p.featured);
  const regularPosts = data.posts.filter((p) => !p.featured);

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
        categories={data.categories}
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
