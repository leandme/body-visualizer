import { Metadata } from "next";
import { canonicalUrl } from "../../seo";

export const metadata: Metadata = {
  title: "Privacy Policy - Body Visualizer",
  description: "Learn how Body Visualizer handles input data, usage analytics, and privacy rights.",
  alternates: {
    canonical: canonicalUrl("/privacy"),
  },
};

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-lg mb-4">
        Welcome to Body Visualizer. Your privacy matters to us. This policy explains what information we process and
        how we use it.
      </p>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Information We Process</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Values you enter in the tool, such as height, weight, BMI, and body-fat percentage.</li>
          <li>Basic technical data such as browser type and device metadata.</li>
          <li>Usage analytics to improve reliability and UX.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">How We Use Information</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>To render Body Visualizer outputs and calculate results.</li>
          <li>To improve product quality, performance, and stability.</li>
          <li>To protect the service from abuse and misuse.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
        <p>
          We aim to minimize retention. Uploaded photos are intended for processing and result generation only.
          Retention duration may vary based on operational and security requirements.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Request access to information associated with your interactions.</li>
          <li>Request correction or deletion when applicable.</li>
          <li>Ask questions about data handling and security practices.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Contact</h2>
        <p>
          Privacy questions can be sent to{" "}
          <a href="mailto:matt@leandme.com" className="text-primary hover:underline">
            matt@leandme.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}
