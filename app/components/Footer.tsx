export default function Footer() {
  return (
    <footer className="bg-[#18181b] text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="max-w-2xl">
          <a href="/">
            <div className="flex items-center gap-2">
              <img
                src="/favicon.ico"
                alt="Body Visualizer Logo"
                width={32}
                height={32}
                className="w-8 h-8 shrink-0 object-contain"
                loading="eager"
              />
              <span className="text-lg font-semibold">Body Visualizer</span>
            </div>
          </a>
          <p className="mt-3 text-base text-gray-300 leading-relaxed">
            Use interactive body visualization to explore BMI, body fat, height, and weight scenarios in real time.
          </p>
        </div>

        <div className="my-8 h-px bg-white/10" />

        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2">
          <div>
            <h6 className="text-lg font-semibold text-gray-200">Site</h6>
            <ul className="mt-3 space-y-2 text-base text-gray-300">
              <li>
                <a className="hover:text-white" href="/about">
                  About
                </a>
              </li>
              <li>
                <a className="hover:text-white" href="/contact">
                  Contact
                </a>
              </li>
              <li>
                <a className="hover:text-white" href="/faqs">
                  FAQs
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h6 className="text-lg font-semibold text-gray-200">More Tools</h6>
            <ul className="mt-3 space-y-2 text-base text-gray-300">
              <li>
                <a
                  className="hover:text-white"
                  href="https://bodyfatestimator.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Body Fat Estimator
                </a>
              </li>
              <li>
                <a
                  className="hover:text-white"
                  href="https://ai-calorie-counter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  AI Calorie Counter
                </a>
              </li>
              <li>
                <a
                  className="hover:text-white"
                  href="https://jawlinecheck.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Jawline Check
                </a>
              </li>
              <li>
                <a
                  className="hover:text-white"
                  href="https://heightestimatorai.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Height Estimator
                </a>
              </li>
              <li>
                <a
                  className="hover:text-white"
                  href="https://bodyfatestimator.ai/canthal-tilt"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Canthal Tilt Test
                </a>
              </li>
              <li>
                <a
                  className="hover:text-white"
                  href="https://bodyshapeanalyzer.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Body Shape Analyzer
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="my-8 h-px bg-white/10" />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-gray-400">© {new Date().getFullYear()} — All Rights Reserved.</span>
          <span className="text-xs text-gray-400 max-w-2xl leading-relaxed">
            <a href="/terms" className="hover:underline">
              Terms
            </a>{" "}
            |{" "}
            <a href="/privacy" className="hover:underline">
              Privacy
            </a>{" "}
            |{" "}
            <a href="/cookies" className="hover:underline">
              Cookie
            </a>{" "}
            |{" "}
            <a href="/security" className="hover:underline">
              Security
            </a>{" "}
            |{" "}
            <a href="/subprocessors" className="hover:underline">
              Subprocessors
            </a>{" "}
            |{" "}
            <a href="/sitemap-html" className="hover:underline">
              Sitemap
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
