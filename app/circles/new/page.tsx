import { AppShell } from "@/components/app-shell";
import { NewCircleForm } from "@/components/new-circle-form";

export default function NewCirclePage() {
  return (
    <AppShell active="My circles">
      <NewCircleForm />
    </AppShell>
  );
}
