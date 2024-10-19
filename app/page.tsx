import { LandVisualizerComponent } from "@/components/land-visualizer";
import { Suspense } from "react";

export default function Home() {
  return (
    <div>
      <Suspense>
        <LandVisualizerComponent />
      </Suspense>
    </div>
  );
}
