"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const searchParams = useSearchParams();
  const linkError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(
    linkError ? "El enlace expiró o no es válido. Pide uno nuevo." : null,
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });

    setLoading(false);
    if (error) {
      setError("No pudimos enviar el enlace. Intenta de nuevo.");
    } else {
      setSent(true);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Mi Lana</CardTitle>
        <CardDescription>
          Gastos tuyos y de tu pareja, en un solo lugar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <p className="text-sm text-muted-foreground">
            Revisa tu correo — te enviamos un enlace para entrar. Puedes cerrar
            esta pestaña.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
            <Button type="submit" disabled={loading}>
              {loading ? "Enviando…" : "Enviar enlace mágico"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
