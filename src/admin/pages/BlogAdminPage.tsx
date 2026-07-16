import { useLanguage } from "@/context/LanguageContext";
import PageHeader from "../components/PageHeader";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, ArrowLeft, Save, X, Search } from "lucide-react";
import { getAllPosts, createPost, updatePost, deletePost } from "@/admin/repositories/blog.repository";
import type { BlogPostRow } from "@/types/database.types";
import FileUploadField from "../components/FileUploadField";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.42, delay, ease: [0.22, 1, 0.36, 1] as const },
});

function toSlug(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

const ACCENTS = [
  { label: "Pink → Soft Pink", from: "from-primary-pink", to: "to-soft-pink" },
  { label: "Soft Purple → Lavender", from: "from-soft-purple", to: "to-lavender-purple" },
  { label: "Lavender → Soft Pink", from: "from-lavender-purple", to: "to-soft-pink" },
  { label: "Soft Pink → Lavender", from: "from-soft-pink", to: "to-lavender-purple" },
  { label: "Pink → Lavender", from: "from-primary-pink", to: "to-lavender-purple" },
  { label: "Soft Purple → Pink", from: "from-soft-purple", to: "to-primary-pink" },
];

const ACCENT_PREVIEW: Record<string, string> = {
  "from-primary-pink": "#f472b6",
  "from-soft-purple": "#c084fc",
  "from-lavender-purple": "#a78bfa",
  "from-soft-pink": "#f9a8d4",
  "to-soft-pink": "#f9a8d4",
  "to-lavender-purple": "#a78bfa",
  "to-primary-pink": "#f472b6",
  "to-soft-purple": "#c084fc",
};

type FormState = {
  title_en: string;
  title_ar: string;
  slug: string;
  excerpt_en: string;
  excerpt_ar: string;
  content_en: string;
  content_ar: string;
  cover_image: string;
  published: boolean;
  published_at: string;
  tags: string;
  category: string;
  author_name: string;
  author_avatar: string;
  read_time_minutes: number;
  accentFrom: string;
  accentTo: string;
  featured: boolean;
};

const EMPTY_FORM: FormState = {
  title_en: "",
  title_ar: "",
  slug: "",
  excerpt_en: "",
  excerpt_ar: "",
  content_en: "",
  content_ar: "",
  cover_image: "",
  published: false,
  published_at: new Date().toISOString().slice(0, 10),
  tags: "",
  category: "General",
  author_name: "Shelan",
  author_avatar: "/portrait.jpg",
  read_time_minutes: 5,
  accentFrom: "from-soft-purple",
  accentTo: "to-lavender-purple",
  featured: false,
};

function formFromRow(row: BlogPostRow): FormState {
  const details = row.details ?? {};
  return {
    title_en: row.title_en ?? "",
    title_ar: row.title_ar ?? "",
    slug: row.slug ?? "",
    excerpt_en: row.excerpt_en ?? "",
    excerpt_ar: row.excerpt_ar ?? "",
    content_en: row.content_en ?? "",
    content_ar: row.content_ar ?? "",
    cover_image: row.cover_image ?? "",
    published: row.published ?? false,
    published_at: row.published_at ? row.published_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
    tags: row.tags ? row.tags.join(", ") : "",
    category: row.category ?? "General",
    author_name: row.author_name ?? "Shelan",
    author_avatar: row.author_avatar ?? "/portrait.jpg",
    read_time_minutes: row.read_time_minutes ?? 5,
    accentFrom: details.accentFrom ?? "from-soft-purple",
    accentTo: details.accentTo ?? "to-lavender-purple",
    featured: details.featured ?? false,
  };
}

export default function BlogAdminPage() {
  const { language } = useLanguage();
  const [view, setView] = useState<"list" | "edit">("list");
  const [editing, setEditing] = useState<BlogPostRow | null>(null);
  const [posts, setPosts] = useState<BlogPostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const data = await getAllPosts();
    setPosts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSlugTouched(false);
    setView("edit");
  };

  const openEdit = (row: BlogPostRow) => {
    setEditing(row);
    setForm(formFromRow(row));
    setSlugTouched(true);
    setView("edit");
  };

  const handleTitleChange = (val: string) => {
    setForm((f) => ({
      ...f,
      title_en: val,
      slug: slugTouched ? f.slug : toSlug(val),
    }));
  };

  const handleTogglePublish = async (row: BlogPostRow) => {
    await updatePost(row.id, { published: !row.published });
    await loadPosts();
  };

  const handleDelete = async (row: BlogPostRow) => {
    if (!window.confirm(`Delete "${row.title_en}"? This cannot be undone.`)) return;
    await deletePost(row.id);
    await loadPosts();
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      title_en: form.title_en,
      title_ar: form.title_ar || null,
      slug: form.slug,
      excerpt_en: form.excerpt_en || null,
      excerpt_ar: form.excerpt_ar || null,
      content_en: form.content_en || null,
      content_ar: form.content_ar || null,
      cover_image: form.cover_image || null,
      published: form.published,
      published_at: form.published_at || null,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      category: form.category || null,
      author_name: form.author_name || null,
      author_avatar: form.author_avatar || null,
      read_time_minutes: form.read_time_minutes || null,
      details: { accentFrom: form.accentFrom, accentTo: form.accentTo, featured: form.featured },
    };

    if (editing) {
      await updatePost(editing.id, payload);
    } else {
      await createPost(payload);
    }
    setSaving(false);
    setView("list");
    await loadPosts();
  };

  const filtered = posts.filter((p) => {
    const q = search.toLowerCase();
    return (
      !q ||
      p.title_en.toLowerCase().includes(q) ||
      (p.category ?? "").toLowerCase().includes(q) ||
      (p.slug ?? "").toLowerCase().includes(q)
    );
  });

  if (view === "edit") {
    return (
      <div>
        {/* Edit Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setView("list")}
            className="flex items-center gap-2 text-[13px] font-medium text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Posts
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView("list")}
              className="px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-60"
            >
              <Save size={14} />
              {saving ? "Saving…" : "Save Post"}
            </button>
          </div>
        </div>

        <motion.div {...fadeUp(0)}>
          <h2 className="text-[18px] font-bold text-[var(--admin-text)] mb-6">
            {editing ? "Edit Post" : "New Post"}
          </h2>

          {/* Bilingual grid */}
          <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden mb-5">
            <div className="px-5 py-4 border-b border-[var(--admin-border)]">
              <span className="text-[13px] font-bold text-[var(--admin-text)]">Content (Bilingual)</span>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* EN Column */}
                <div className="space-y-4">
                  <p className="text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider mb-2">English</p>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Title EN</label>
                    <input
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                      value={form.title_en}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Post title in English"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Slug</label>
                    <input
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                      value={form.slug}
                      onChange={(e) => { setSlugTouched(true); setForm((f) => ({ ...f, slug: e.target.value })); }}
                      placeholder="url-friendly-slug"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Excerpt EN</label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
                      value={form.excerpt_en}
                      onChange={(e) => setForm((f) => ({ ...f, excerpt_en: e.target.value }))}
                      placeholder="Short summary in English"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Content EN</label>
                    <p className="text-[11px] text-[var(--admin-text-faint)] mb-1">Write content. Separate paragraphs with a blank line.</p>
                    <textarea
                      rows={10}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
                      value={form.content_en}
                      onChange={(e) => setForm((f) => ({ ...f, content_en: e.target.value }))}
                      placeholder="Full post content in English…"
                    />
                  </div>
                </div>

                {/* AR Column */}
                <div className="space-y-4" dir="rtl">
                  <p className="text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider mb-2">العربية</p>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Title AR</label>
                    <input
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                      value={form.title_ar}
                      onChange={(e) => setForm((f) => ({ ...f, title_ar: e.target.value }))}
                      placeholder="عنوان المقال بالعربية"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Category</label>
                    <input
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      placeholder="e.g. Nutrition, Wellness"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Excerpt AR</label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
                      value={form.excerpt_ar}
                      onChange={(e) => setForm((f) => ({ ...f, excerpt_ar: e.target.value }))}
                      placeholder="ملخص قصير بالعربية"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Content AR</label>
                    <p className="text-[11px] text-[var(--admin-text-faint)] mb-1">اكتبي المحتوى. افصلي الفقرات بسطر فارغ.</p>
                    <textarea
                      rows={10}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
                      value={form.content_ar}
                      onChange={(e) => setForm((f) => ({ ...f, content_ar: e.target.value }))}
                      placeholder="محتوى المقال الكامل بالعربية…"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Shared fields */}
          <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden mb-5">
            <div className="px-5 py-4 border-b border-[var(--admin-border)]">
              <span className="text-[13px] font-bold text-[var(--admin-text)]">Meta & Publishing</span>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Cover Image URL</label>
                  <FileUploadField
                    value={form.cover_image}
                    onChange={(url) => setForm((f) => ({ ...f, cover_image: url }))}
                    folder="blog/covers"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Tags (comma-separated)</label>
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                    value={form.tags}
                    onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                    placeholder="nutrition, wellness, tips"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Author Name</label>
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                    value={form.author_name}
                    onChange={(e) => setForm((f) => ({ ...f, author_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Author Avatar URL</label>
                  <FileUploadField
                    value={form.author_avatar}
                    onChange={(url) => setForm((f) => ({ ...f, author_avatar: url }))}
                    folder="blog/avatars"
                    placeholder="/portrait.jpg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Read Time (minutes)</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                    value={form.read_time_minutes}
                    onChange={(e) => setForm((f) => ({ ...f, read_time_minutes: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Published At</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                    value={form.published_at}
                    onChange={(e) => setForm((f) => ({ ...f, published_at: e.target.value }))}
                  />
                </div>
              </div>

              {/* Accent selector */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Accent Gradient</label>
                <div className="flex flex-wrap gap-2">
                  {ACCENTS.map((a) => {
                    const selected = form.accentFrom === a.from && form.accentTo === a.to;
                    return (
                      <button
                        key={a.label}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, accentFrom: a.from, accentTo: a.to }))}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-all ${selected ? "border-primary-pink/60 bg-primary-pink/5 text-[var(--admin-text)]" : "border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)]"}`}
                      >
                        <span
                          className="w-4 h-4 rounded-full shrink-0"
                          style={{ background: `linear-gradient(to right, ${ACCENT_PREVIEW[a.from]}, ${ACCENT_PREVIEW[a.to]})` }}
                        />
                        {a.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                    className="w-4 h-4 rounded accent-pink-400"
                  />
                  <span className="text-[13px] font-medium text-[var(--admin-text)]">Featured post</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                    className="w-4 h-4 rounded accent-pink-400"
                  />
                  <span className="text-[13px] font-medium text-[var(--admin-text)]">Published</span>
                </label>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div>
      <PageHeader
        title="Blog Posts"
        description="Manage all blog articles published on the SHELAN website."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Blog" }]}
      />

      <motion.div {...fadeUp(0)} className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--admin-border)]">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-faint)]" />
            <input
              className="pl-8 pr-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors w-56"
              placeholder="Search posts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all">
            <Plus size={14} />
            New Post
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--admin-hover-bg)]">
              <tr>
                <th className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider whitespace-nowrap">Title</th>
                <th className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider whitespace-nowrap">Category</th>
                <th className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider whitespace-nowrap">Date</th>
                <th className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[13px] text-[var(--admin-text-faint)]">Loading posts…</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[13px] text-[var(--admin-text-faint)]">No posts found.</td>
                </tr>
              ) : (
                filtered.map((post) => (
                  <tr key={post.id} className="border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-hover-bg)] transition-colors">
                    <td className="py-3 px-4 text-[13px] text-[var(--admin-text)]">
                      <div className="font-medium">{post.title_en}</div>
                      {post.title_ar && <div className="text-[12px] text-[var(--admin-text-muted)] mt-0.5" dir="rtl">{post.title_ar}</div>}
                    </td>
                    <td className="py-3 px-4 text-[13px] text-[var(--admin-text)]">{post.category ?? "—"}</td>
                    <td className="py-3 px-4 text-[13px] text-[var(--admin-text)]">
                      {post.published ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--admin-hover-bg)] text-[var(--admin-text-faint)] ring-1 ring-[var(--admin-border)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--admin-text-faint)]" />
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[13px] text-[var(--admin-text)]">
                      {post.published_at ? new Date(post.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(post)}
                          title="Edit"
                          className="p-1.5 rounded-lg text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] hover:text-[var(--admin-text)] transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleTogglePublish(post)}
                          title={post.published ? "Unpublish" : "Publish"}
                          className="p-1.5 rounded-lg text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] hover:text-[var(--admin-text)] transition-colors"
                        >
                          {post.published ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          onClick={() => handleDelete(post)}
                          title="Delete"
                          className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
