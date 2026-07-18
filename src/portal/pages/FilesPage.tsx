/**
 * Portal — My Files
 * Lists files shared with the client by the admin.
 *
 * Note: the uploaded_files table stores filename/type/size but does not include
 * a storage URL. Download links are therefore not available until the admin
 * uploads files through a flow that persists the storage path. Files are shown
 * as a read-only list so clients can see what has been shared with them.
 */

import { useState, useEffect } from "react";
import { Folder, FileText, FileImage, File, AlertCircle, Info } from "lucide-react";
import { useClientProfile } from "@/hooks/useClientProfile";
import { useLanguage } from "@/context/LanguageContext";
import {
  getOwnFiles,
  type PortalFile,
} from "@/portal/repositories/files.repository";

function FileTypeIcon({ type }: { type: string | null }) {
  const t = (type ?? "").toLowerCase();
  if (t.includes("image"))    return <FileImage size={16} className="text-blue-400" />;
  if (t === "pdf")            return <FileText  size={16} className="text-red-400"  />;
  return <File size={16} className="text-ivory/40" />;
}

function TypeBadge({ type }: { type: string | null }) {
  const t = (type ?? "file").toUpperCase();
  return (
    <span className="text-[10px] font-semibold text-ivory/40 bg-white/8 px-2 py-0.5 rounded-full border border-white/8 uppercase">
      {t}
    </span>
  );
}

export default function FilesPage() {
  const { profile, loading: profileLoading } = useClientProfile();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const [files,   setFiles]   = useState<PortalFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      if (!profileLoading) setLoading(false);
      return;
    }
    getOwnFiles(profile.id).then((data) => {
      setFiles(data);
      setLoading(false);
    });
  }, [profile, profileLoading]);

  if (profileLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-primary-pink border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-ivory">
        {isAr ? "ملفاتي" : "My Files"}
      </h1>

      {/* Info notice */}
      <div className="flex items-start gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-ivory/60">
        <Info size={15} className="text-ivory/30 shrink-0 mt-0.5" />
        <span>
          {isAr
            ? "الملفات المدرجة هنا تمت مشاركتها من قِبل أخصائي التغذية. تواصل معهم مباشرةً للحصول على أحدث النسخ أو الروابط."
            : "Files listed here were shared by your nutritionist. Contact them directly to receive the latest copies or links."}
        </span>
      </div>

      {files.length === 0 ? (
        <div className="py-16 flex flex-col items-center text-center bg-white/3 border border-white/8 rounded-2xl px-6">
          <div className="w-14 h-14 rounded-2xl bg-white/8 flex items-center justify-center mb-4">
            <Folder className="text-ivory/30" size={26} />
          </div>
          <h3 className="font-heading text-base font-semibold text-ivory mb-2">
            {isAr ? "لا توجد ملفات بعد" : "No files shared yet"}
          </h3>
          <p className="text-sm text-ivory/40 max-w-xs">
            {isAr
              ? "ستظهر هنا الملفات التي يشاركها معك أخصائي التغذية، مثل التقارير والتحاليل."
              : "Files shared by your nutritionist — such as reports and lab results — will appear here."}
          </p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-5 py-3 text-start text-xs font-semibold text-ivory/40 uppercase tracking-wide">
                    {isAr ? "الملف" : "File"}
                  </th>
                  <th className="px-5 py-3 text-start text-xs font-semibold text-ivory/40 uppercase tracking-wide">
                    {isAr ? "النوع" : "Type"}
                  </th>
                  <th className="px-5 py-3 text-start text-xs font-semibold text-ivory/40 uppercase tracking-wide">
                    {isAr ? "الحجم" : "Size"}
                  </th>
                  <th className="px-5 py-3 text-start text-xs font-semibold text-ivory/40 uppercase tracking-wide">
                    {isAr ? "تاريخ المشاركة" : "Shared"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <FileTypeIcon type={file.type} />
                        <span className="text-ivory truncate max-w-[200px]">{file.filename}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4"><TypeBadge type={file.type} /></td>
                    <td className="px-5 py-4 text-ivory/50">{file.sizeLabel || "—"}</td>
                    <td className="px-5 py-4 text-ivory/50">
                      {new Date(file.uploaded_at).toLocaleDateString(isAr ? "ar-KW" : "en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-white/5">
            {files.map((file) => (
              <div key={file.id} className="p-4 flex items-center gap-3">
                <FileTypeIcon type={file.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ivory truncate">{file.filename}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <TypeBadge type={file.type} />
                    {file.sizeLabel && <span className="text-xs text-ivory/30">{file.sizeLabel}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer notice */}
      {files.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-ivory/30">
          <AlertCircle size={11} />
          {isAr
            ? "لتنزيل ملف، يرجى التواصل مع أخصائي التغذية مباشرةً."
            : "To download a file, please contact your nutritionist directly."}
        </div>
      )}
    </div>
  );
}
