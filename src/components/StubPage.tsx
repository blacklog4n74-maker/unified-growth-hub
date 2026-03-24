import { LucideIcon } from "lucide-react";

interface StubPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export default function StubPage({ title, description, icon: Icon }: StubPageProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] p-6 animate-fade-in">
      <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon size={28} className="text-muted-foreground" />
      </div>
      <h2 className="text-sm font-semibold text-foreground mb-1">{title}</h2>
      <p className="text-xs text-muted-foreground text-center max-w-xs">{description}</p>
    </div>
  );
}
