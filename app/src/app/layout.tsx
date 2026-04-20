import "./globals.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ThemeSync } from "@/components/theme/theme-sync";

export const metadata: Metadata = {
  title: "AI Interview Coach & Evaluator Platform",
  description: "Premium AI-powered mock interview SaaS for students and job seekers."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var stored = localStorage.getItem('ai-interview-theme') || 'system';
                  var resolved = stored === 'system'
                    ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
                    : stored;
                  document.documentElement.dataset.theme = resolved;
                } catch (error) {}
              })();
            `
          }}
        />
        <ThemeSync />
        {children}
      </body>
    </html>
  );
}
