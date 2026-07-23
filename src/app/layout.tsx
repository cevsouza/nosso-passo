import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Manrope } from "next/font/google";
import { LanguageProvider } from "@/lib/LanguageContext";
import "./globals.css";

// Body / UI text — warm humanist sans.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Display / headings / chrome — clean humanist (Workspace-elegant).
// Kept on the --font-outfit variable so the `font-Outfit` class used across the
// app keeps working (the variable name is historical; it now holds Manrope).
const manrope = Manrope({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nosso Passo",
  description: "Um app divertido e previsível para rotinas de crianças com TEA",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nosso Passo",
  },
};

export const viewport: Viewport = {
  themeColor: "#2f8f86",
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${jakarta.variable} ${manrope.variable}`}>
        {/* Apply the saved theme before first paint so dark mode is consistent
            across every page (not only where a component effect runs) and there
            is no light flash on load. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('tea_theme')||'system';if(t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}`,
          }}
        />
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}

