import Link from "next/link";
import { redirect } from "next/navigation";
import { getMembership } from "@/lib/household";
import { SignOutButton } from "@/components/sign-out-button";

// Shell for the authenticated, onboarded area. Guests and users without a
// household are bounced by the proxy (auth) and here (onboarding).
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const membership = await getMembership();
  if (!membership) redirect("/onboarding");

  return (
    <>
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
          <Link href="/" className="font-semibold">
            Mi Lana
          </Link>
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground">
                Inicio
              </Link>
              <Link href="/categories" className="hover:text-foreground">
                Categorías
              </Link>
              <Link href="/payment-methods" className="hover:text-foreground">
                Pagos
              </Link>
              <Link href="/settings" className="hover:text-foreground">
                Ajustes
              </Link>
            </nav>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        {children}
      </main>
    </>
  );
}
