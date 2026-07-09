import { Metadata } from "next";
import { canonicalUrl } from "../../seo";

export const metadata: Metadata = {
  title: "Security Policy - Body Visualizer",
  description: "Security practices and data-protection approach for Body Visualizer.",
  alternates: {
    canonical: canonicalUrl("/security"),
  },
};

export default function SecurityPage() {
  return (
    <div className="container mx-auto px-4 py-8 lg:px-8 lg:py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-6">Security Policy</h1>
      <p className="text-lg mb-4">
        Protecting your data is important to us. This page outlines how Body Visualizer approaches security and data
        protection.
      </p>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Transport Security</h2>
        <p>
          Traffic to and from Body Visualizer is intended to be served over HTTPS using modern TLS standards provided
          by our hosting infrastructure.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Operational Security</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Access controls for service infrastructure.</li>
          <li>Monitoring for reliability, abuse, and anomalous activity.</li>
          <li>Ongoing updates to dependencies and runtime components.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Responsible Use</h2>
        <p>
          Users should secure their own devices and avoid sharing sensitive credentials or private data in uploads.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Security Contact</h2>
        <p>
          To report a security concern, contact{" "}
          <a href="mailto:matt@leandme.com" className="text-primary hover:underline">
            matt@leandme.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}
