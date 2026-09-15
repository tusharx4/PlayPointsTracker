import { AppProvider } from "@/lib/store";
import Shell from "@/components/Shell";

export default function Home() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
