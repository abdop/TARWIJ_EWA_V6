import Link from "next/link";
import { useRouter } from "next/router";
import type { ReactNode } from "react";

export interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

type LayoutProps = {
  title: string;
  description?: string;
  children: ReactNode;
  navigation: NavigationItem[];
  appName: string;
  appSubtitle: string;
};

export default function Layout({
  title,
  description,
  children,
  navigation,
  appName,
  appSubtitle,
}: LayoutProps) {
  const router = useRouter();

  return (
    <div className="bg-background-dark min-h-screen text-gray-200">
      <div className="flex min-h-screen">
        <aside className="w-72 bg-background-dark/80 p-6 flex flex-col border-r border-gray-800">
          <div className="mb-10">
            <h1 className="text-2xl font-bold text-white">{appName}</h1>
            <p className="text-sm text-gray-500 mt-1">{appSubtitle}</p>
          </div>
          <nav className="flex flex-col space-y-2">
            {navigation.map((item) => {
              const active =
                item.href === "/"
                  ? router.pathname === "/"
                  : router.pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    active
                      ? "bg-primary/30 text-primary font-semibold"
                      : "text-gray-300 hover:bg-primary/10"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-10 bg-background-dark/90 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            <header>
              <h2 className="text-4xl font-bold text-white">{title}</h2>
              {description ? (
                <p className="text-gray-400 mt-2">{description}</p>
              ) : null}
            </header>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
