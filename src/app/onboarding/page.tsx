import { redirect } from "next/navigation";
import { getMembership } from "@/lib/household";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const membership = await getMembership();
  if (membership) redirect("/");

  return (
    <main className="flex min-h-svh flex-1 items-center justify-center p-6">
      <OnboardingForm />
    </main>
  );
}
