import { Metadata } from "next";
import Pricing from "@/app/components/Pricing";
import PricingFAQ from "@/app/components/PricingFAQ";
import PricingHeroHeading from "@/app/components/PricingHeroHeading";
import { canonicalUrl } from "../../seo";

const title = "Pricing";
const description = "Body Visualizer pricing for 10 AI visualizations or unlimited body visualization access.";

export const metadata: Metadata = {
  title: title,
  description: description,
  alternates: {
    canonical: canonicalUrl("/pricing"),
  },
};

type PricingPageParams = {
  uploaded?: string;
};

export default async function PricingPage({
  searchParams,
}: {
  searchParams?: Promise<PricingPageParams>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const hasUploadedImage = params?.uploaded === "1";

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center px-4 py-12 lg:pb-20 lg:pt-8">
      <div className="flex flex-col items-center gap-5 text-center">
        <PricingHeroHeading />
        <p className="max-w-3xl text-lg leading-relaxed text-gray-700">
          {hasUploadedImage
            ? "Select a plan to unlock Body Visualizer AI and generate your body-shape preview."
            : "Choose 10 visualizations for quick scenario testing, or unlock unlimited access for ongoing body-shape planning."}
        </p>
      </div>

      <div className="mt-8 w-full">
        <Pricing />
      </div>

      <PricingFAQ />
    </div>
  );
}
