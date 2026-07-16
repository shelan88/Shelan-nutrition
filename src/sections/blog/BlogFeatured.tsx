/**
 * BlogFeatured — Large featured article card at top of blog listing.
 * Props-only, CMS-ready.
 */
import { motion } from "framer-motion";
import { Clock, ArrowRight, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import Tag from "@/components/ui/Tag";
import type { CMSBlogPost } from "@/types/cms.types";

interface Props {
  post: CMSBlogPost;
  featuredLabel: string;
  readMoreLabel: string;
  minReadLabel: string;
  byLabel: string;
}

export default function BlogFeatured({
  post,
  featuredLabel,
  readMoreLabel,
  minReadLabel,
  byLabel,
}: Props) {
  const formattedDate = new Date(post.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.65 }}
          className="group grid lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden border border-soft-purple/12 shadow-2xl shadow-deep-purple/12 hover:shadow-deep-purple/20 transition-shadow duration-300"
        >
          {/* Gradient image */}
          <div
            className={`relative h-64 lg:h-auto min-h-72 bg-gradient-to-br ${post.accentFrom} ${post.accentTo} overflow-hidden`}
          >
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute -bottom-12 -start-12 w-56 h-56 rounded-full bg-white/10" />
            <div className="absolute -top-8 -end-8 w-40 h-40 rounded-full bg-white/10" />
            <div className="absolute inset-0 flex flex-col justify-end p-8">
              <Tag variant="ghost" className="self-start mb-3">
                {featuredLabel}
              </Tag>
              <Tag variant="ghost" className="self-start">
                {post.category}
              </Tag>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white p-8 lg:p-10 flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Tag variant="primary">{post.category}</Tag>
              <span className="flex items-center gap-1.5 text-xs text-deep-purple/45 font-medium">
                <Calendar size={12} />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-deep-purple/45 font-medium">
                <Clock size={12} />
                {post.readTimeMinutes} {minReadLabel}
              </span>
            </div>

            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-heading mb-4 leading-tight">
              {post.title}
            </h2>

            <p className="text-body leading-relaxed mb-6 opacity-80">{post.excerpt}</p>

            <div className="flex items-center gap-4">
              <img
                src={post.author.avatarUrl}
                alt={post.author.name}
                className="w-9 h-9 rounded-full object-cover border-2 border-light-pink"
              />
              <div>
                <p className="text-xs font-semibold text-heading">
                  {byLabel} {post.author.name}
                </p>
                <p className="text-xs text-deep-purple/50">{post.author.bio}</p>
              </div>
            </div>

            <Link
              to={`/blog/${post.slug}`}
              className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-primary-pink hover:text-deep-purple transition-colors group/link"
            >
              {readMoreLabel}
              <ArrowRight
                size={15}
                className="group-hover/link:translate-x-1 rtl:rotate-180 rtl:group-hover/link:-translate-x-1 transition-transform"
              />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
