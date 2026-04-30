import { Metadata } from "next";
import BodyVisualizerTool from "../components/BodyVisualizerTool";

const title = "Body Visualizer – Interactive 3D Body Shape Estimator";
const description =
  "Interactive body visualizer with male/female morph models, advanced measurements, local presets, and snapshot export.";

export const metadata: Metadata = {
  title,
  description,
};

export default function Home() {
  return (
    <div className="-mx-4 -my-8 min-h-screen bg-[#02050a] px-3 py-3 text-white sm:px-4 lg:-mx-8 lg:px-6 lg:py-6">
      <BodyVisualizerTool />
    </div>
  );
}
