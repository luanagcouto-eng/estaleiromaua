"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const IconChart = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M3 3v18h18M7 16l4-4 4 4 4-4" />
  </svg>
);

const IconTarget = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <circle cx="12" cy="12" r="9" strokeWidth={1.8} />
    <circle cx="12" cy="12" r="5" strokeWidth={1.8} />
    <circle cx="12" cy="12" r="1" strokeWidth={1.8} />
  </svg>
);

const IconUsers = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4a4 4 0 11-8 0 4 4 0 018 0zM3 7a4 4 0 118 0" />
  </svg>
);

const IconSettings = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconOrg = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2zM9 11v2m6-2v2M12 7v2" />
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  { label: "Visão Geral",   href: "/overview",         icon: <IconOrg />,      roles: ["ceo"] },
  { label: "Minhas Metas",  href: "/my-goals",         icon: <IconTarget />,   roles: ["ceo", "director", "manager"] },
  { label: "Minha Equipe",  href: "/team",             icon: <IconUsers />,    roles: ["ceo", "director"] },
  { label: "Relatórios",    href: "/reports",          icon: <IconChart />,    roles: ["ceo"] },
  { label: "Usuários",      href: "/admin/users",      icon: <IconUsers />,    roles: ["admin", "ceo"] },
  { label: "Metas",         href: "/admin/goals",      icon: <IconTarget />,   roles: ["admin", "ceo"] },
];

const ROLE_LABELS: Record<UserRole, string> = {
  ceo:      "CEO",
  director: "Diretor(a)",
  manager:  "Gestor(a)",
  admin:    "Administrador",
};

interface AppSidebarProps {
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
}

export default function AppSidebar({ name, email, role, avatarUrl }: AppSidebarProps) {
  const pathname = usePathname();
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#364B59] flex flex-col z-40 select-none">

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#2D3F4A]">
        <Image src="/logo-maua.svg" alt="Estaleiro Mauá" width={100} height={44} className="object-contain brightness-0 invert" />
      </div>

      {/* Nav */}
      <nav aria-label="Navegação principal" className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {visibleItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-[#F18213] text-white"
                  : "text-[#C8D5DC] hover:bg-[#2D3F4A] hover:text-white"
              )}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-[#2D3F4A] p-4 space-y-3">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={name} width={36} height={36} className="rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#F18213] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{name}</p>
            <p className="text-[#94A3B8] text-xs truncate">{email}</p>
          </div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            aria-label="Sair da conta"
            className="w-full flex items-center justify-center gap-2 text-xs text-[#94A3B8] hover:text-white py-2 rounded-lg hover:bg-[#2D3F4A] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair
          </button>
        </form>
      </div>

    </aside>
  );
}
