import Link from "next/link";
import GridShape from "@/components/common/GridShape";
import Logo from "@/components/common/Logo";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div className="relative flex lg:flex-row w-full h-app-screen justify-center flex-col dark:bg-gray-900 sm:p-0">
        {children}

        <div className="lg:w-1/2 w-full h-full bg-brand-950 dark:bg-white/5 lg:grid items-center hidden">
          <div className="relative items-center justify-center flex z-1">
            <GridShape />
            <div className="flex flex-col items-center max-w-xs">
              <Link href="/" className="block mb-4">
                <Logo size="lg" tone="light" />
              </Link>
              <p className="text-center text-gray-400 dark:text-white/60">
                API global conectada às bases públicas do INPI e do TMView
              </p>
            </div>
          </div>
        </div>

        <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
