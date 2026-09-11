import type { Metadata } from "next";
import { Nunito, Outfit } from "next/font/google";
import { ThemeProvider } from "@/providers/theme-provider";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-sans",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Atlass Fin",
  description: "Gestor financiero personal",
};

const RootLayout = ({ children }: LayoutProps<"/">) => {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${nunito.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
