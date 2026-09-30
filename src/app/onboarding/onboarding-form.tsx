"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function OnboardingForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(action: "create" | "join") {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } =
      action === "create"
        ? await supabase.rpc("create_household", { p_name: name.trim() })
        : await supabase.rpc("join_household", {
            p_invite_code: code.trim(),
          });

    setLoading(false);
    if (error) {
      setError(
        error.message.includes("invalid invite code")
          ? "Código inválido. Pídele el código a tu pareja."
          : "No se pudo completar. Intenta de nuevo.",
      );
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Bienvenido a Mi Lana</CardTitle>
        <CardDescription>
          Crea un hogar nuevo o únete al de tu pareja.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="create">
          <TabsList className="w-full">
            <TabsTrigger value="create" className="flex-1">
              Crear hogar
            </TabsTrigger>
            <TabsTrigger value="join" className="flex-1">
              Unirme
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <form
              className="flex flex-col gap-4 pt-2"
              onSubmit={(event) => {
                event.preventDefault();
                submit("create");
              }}
            >
              <div className="grid gap-2">
                <Label htmlFor="household-name">Nombre del hogar</Label>
                <Input
                  id="household-name"
                  required
                  placeholder="Casa"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Creando…" : "Crear"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="join">
            <form
              className="flex flex-col gap-4 pt-2"
              onSubmit={(event) => {
                event.preventDefault();
                submit("join");
              }}
            >
              <div className="grid gap-2">
                <Label htmlFor="invite-code">Código de invitación</Label>
                <Input
                  id="invite-code"
                  required
                  placeholder="a1b2c3d4"
                  className="font-mono"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Uniéndote…" : "Unirme"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {error ? (
          <p className="pt-4 text-sm text-destructive">{error}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
