import { Metadata } from "next";
import { canonicalUrl } from "../../seo";

export const metadata: Metadata = {
  title: "Subprocessors - Body Visualizer",
  description: "Third-party service providers that may process data for Body Visualizer.",
  alternates: {
    canonical: canonicalUrl("/subprocessors"),
  },
};

export default function SubprocessorsPage() {
  return (
    <div className="container mx-auto px-4 py-8 lg:px-8 lg:py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-6">Subprocessors</h1>
      <p className="text-lg mb-6">
        Body Visualizer may rely on third-party infrastructure and service providers to operate securely and reliably.
      </p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Typical Categories</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Cloud hosting and content delivery</li>
          <li>Analytics and observability</li>
          <li>Image/model processing infrastructure</li>
          <li>Domain, DNS, and platform operations</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Questions</h2>
        <p>
          For current subprocessor details, contact{" "}
          <a href="mailto:bodyfatestimator@gmail.com" className="text-primary hover:underline">
            bodyfatestimator@gmail.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}
