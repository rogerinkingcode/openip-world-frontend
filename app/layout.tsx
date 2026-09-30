import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";

const outfit = Outfit({
  variable: "--font-outfit-next",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "OpenIP World",
    template: "%s | OpenIP World",
  },
  description: "API global conectada às bases públicas do INPI e do TMView",
};

// Roda durante o parse do HTML, antes da primeira pintura: sem ele quem escolheu
// o tema escuro veria a tela clara piscar até o React hidratar.
const themeScript = `(function(){try{if(localStorage.getItem("theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: o script acima pode acrescentar "dark" à classe
    // do <html> antes da hidratação, e o DOM é quem deve prevalecer.
    <html lang="pt-BR" className={outfit.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="dark:bg-gray-900">
        <ThemeProvider>
          {/* No layout raiz para o toast sobreviver à troca de layout (ex.: o
              "Você saiu da conta" disparado no painel aparece já no login). */}
          <ToastProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
