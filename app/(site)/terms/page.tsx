import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions - Body Visualizer",
  description: "Terms governing use of Body Visualizer and its interactive body-composition modeling features.",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 lg:px-8 lg:py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-6">Terms &amp; Conditions</h1>
      <p className="mb-4 text-lg">
        These Terms govern your use of Body Visualizer. By using this service, you agree to these terms.
      </p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">1. Service Scope</h2>
        <p>
          Body Visualizer provides interactive body-composition visualization based on uploaded images and
          user-provided inputs such as height, weight, BMI, and body-fat percentage. Results are informational only and
          are not medical advice.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">2. User Responsibilities</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Only upload photos you own or have permission to use.</li>
          <li>Do not use the service for unlawful, abusive, or harmful purposes.</li>
          <li>Do not attempt to disrupt, reverse engineer, or misuse the platform.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">3. No Medical or Clinical Use</h2>
        <p>
          Body Visualizer is not a medical or diagnostic tool. Do not rely on it as a substitute for professional
          evaluation or official measurement.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">4. Disclaimer and Liability</h2>
        <p>
          The service is provided &quot;as is&quot; without warranties of any kind. We do not guarantee uninterrupted
          availability or perfect accuracy. To the maximum extent permitted by law, we are not liable for damages
          arising from use of the service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">5. Changes</h2>
        <p>
          We may update these terms at any time. Continued use after updates means you accept the revised terms.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">6. Contact</h2>
        <p>
          Questions about these Terms can be sent to{" "}
          <a href="mailto:matt@leandme.com" className="text-primary hover:underline">
            matt@leandme.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}
