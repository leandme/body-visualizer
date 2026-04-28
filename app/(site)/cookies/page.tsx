import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy - Body Visualizer",
  description: "Cookie and similar technology usage for Body Visualizer.",
};

export default function CookiesPage() {
  return (
    <div className="container mx-auto px-4 py-8 lg:px-8 lg:py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-6">Cookie Policy</h1>
      <p className="text-lg mb-4">
        This page describes how Body Visualizer may use cookies and similar technologies.
      </p>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">What Cookies Are</h2>
        <p>
          Cookies are small text files stored on your device that help websites remember settings and understand usage
          patterns.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">How We Use Cookies</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Core functionality and session behavior.</li>
          <li>Performance and analytics (where enabled).</li>
          <li>Security and abuse prevention controls.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Your Choices</h2>
        <p>
          You can manage or delete cookies through your browser settings. Disabling certain cookies may affect how the
          site functions.
        </p>
      </section>
    </div>
  );
}
