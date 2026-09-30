import { redirect } from "next/navigation";
import { getMembership } from "@/lib/household";
import { CopyInviteCode } from "@/components/copy-invite-code";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default async function SettingsPage() {
  const membership = await getMembership();
  if (!membership) redirect("/onboarding");

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Ajustes</h1>
      <Card>
        <CardHeader>
          <CardTitle>Hogar</CardTitle>
          <CardDescription>{membership.household.name}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Label htmlFor="invite-code">Código de invitación</Label>
          <CopyInviteCode code={membership.household.invite_code} />
          <p className="text-sm text-muted-foreground">
            Comparte este código con tu pareja para que se una al hogar.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
