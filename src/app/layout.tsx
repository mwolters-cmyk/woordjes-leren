import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import AuthGate from "@/components/AuthGate";
import UserMenu from "@/components/UserMenu";

export const metadata: Metadata = {
  title: "Woordjes Leren - Stedelijk Gymnasium Leiden",
  description: "Oefen je woordjes voor Frans, Engels, Duits, Latijn, Grieks en Nederlands",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className="min-h-screen bg-bg">
        <AuthProvider>
          <header className="bg-primary text-white shadow-md">
            <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                <span className="text-2xl">&#x1F393;</span>
                <h1 className="text-xl font-bold">Woordjes Leren</h1>
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                <Link href="/" className="hover:underline">
                  Lijsten
                </Link>
                <UserMenu />
              </nav>
            </div>
          </header>

          <main className="max-w-4xl mx-auto px-4 py-8">
            <AuthGate>{children}</AuthGate>
          </main>

          <footer className="text-center py-6 text-sm text-text-light">
            <p>Stedelijk Gymnasium Leiden</p>
            <p className="mt-1">
              Handig?{" "}
              <a
                href="https://tikkie.me/pay/abfvlr6u88q23pa1rk2t"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-primary transition-colors"
              >
                Stuur een Tikkie naar de ontwikkelaar &#x1F609;
              </a>
            </p>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
