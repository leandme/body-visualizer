import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sitemap - Body Visualizer",
  description: "HTML sitemap for Body Visualizer.",
};

const links = [
  { href: "/", label: "Home" },
  { href: "/upload", label: "Upload" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/faqs", label: "FAQs" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/cookies", label: "Cookie" },
  { href: "/security", label: "Security" },
  { href: "/subprocessors", label: "Subprocessors" },
  { href: "/sitemap.xml", label: "XML Sitemap" },
];

export default function SitemapHtmlPage() {
  return (
    <div className="container mx-auto px-4 py-8 lg:px-8 lg:py-16 max-w-3xl">
      <h1 className="text-4xl font-bold mb-6">Sitemap</h1>
      <ul className="space-y-3 text-lg">
        {links.map((link) => (
          <li key={link.href}>
            <a href={link.href} className="text-primary hover:underline">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
