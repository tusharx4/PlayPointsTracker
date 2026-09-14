import { AppProvider } from "@/lib/store";
import { PwaProvider } from "@/lib/pwa";
import Shell from "@/components/Shell";

export default function Home() {
  return (
    <AppProvider>
      <PwaProvider>
        <Shell />
      </PwaProvider>
    </AppProvider>
  );
}
