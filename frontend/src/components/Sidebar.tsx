import { Link } from "react-router-dom";
import { createTranslator } from "../i18n";
import type { Language } from "../types";

interface Props {
  language: Language;
  showAnalysis: boolean;
  onToggleLanguage: () => void;
}

export default function Sidebar({
  language,
  showAnalysis,
  onToggleLanguage,
}: Props) {
  const t = createTranslator(language);

  return (
    <aside className="w-[72px] shrink-0 border-r border-white/[0.08] bg-[#030303]/40 backdrop-blur-xl flex flex-col items-center py-6 z-20">
      <button className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-10 shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:scale-105 transition-transform">
        <span className="text-black font-bold text-xl leading-none font-mono">
          SA
        </span>
      </button>

      <nav className="flex flex-col gap-5 flex-1 w-full items-center">
        <button className="p-2.5 rounded-xl bg-white/10 text-white w-10 h-10 flex items-center justify-center">
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </button>

        <div className="w-8 h-px bg-white/[0.08] my-1" />

        <SidebarButton title={t("nav.projects")}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </SidebarButton>

        {showAnalysis && (
          <SidebarButton title={t("nav.analysis")} to="/analysis">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 7h16M4 12h7m-7 5h9m4-5h3m-3 5h3M7 4v6m8 4v6"
            />
          </SidebarButton>
        )}

        <SidebarButton title={t("nav.history")}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </SidebarButton>

        <SidebarButton title={t("nav.settings")}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </SidebarButton>
      </nav>

      <button
        onClick={onToggleLanguage}
        title={t("language.label")}
        aria-label={t("language.label")}
        className="mt-4 w-11 h-8 rounded-full border border-white/[0.08] bg-white/[0.04] text-[11px] font-bold text-zinc-300 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.16] transition-all flex items-center justify-center"
      >
        {language === "en" ? t("language.chinese") : t("language.english")}
      </button>
    </aside>
  );
}

function SidebarButton({
  title,
  to,
  children,
}: {
  title: string;
  to?: string;
  children: React.ReactNode;
}) {
  const className =
    "p-2.5 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all w-10 h-10 flex items-center justify-center group relative";
  const icon = (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        {children}
      </svg>
  );

  if (to) {
    return (
      <Link to={to} className={className} title={title}>
        {icon}
      </Link>
    );
  }

  return (
    <button className={className} title={title}>
      {icon}
    </button>
  );
}
