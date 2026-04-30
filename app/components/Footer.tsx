export default function Footer() {
  return (
    <footer className="bg-white text-gray-900">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="max-w-2xl">
          <a href="/">
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="Body Visualizer Logo"
                width={32}
                height={32}
                className="w-8 h-8 shrink-0 object-contain"
                loading="eager"
              />
              <span className="text-lg font-semibold">Body Visualizer</span>
            </div>
          </a>
          <p className="mt-3 text-base leading-relaxed text-gray-700">
            Visualize unique body shapes instantly. Input BMI, height, weight, body fat % and body measurements to generate a lifelike 3D avatar.
          </p>
        </div>

        <div className="my-8 h-px bg-gray-200" />

        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2">
          <div>
            <h6 className="text-lg font-semibold text-gray-900">Site</h6>
            <ul className="mt-3 space-y-2 text-base text-gray-700">
              <li>
                <a className="hover:text-black" href="/about">
                  About
                </a>
              </li>
              <li>
                <a className="hover:text-black" href="/#homepage-faq">
                  FAQs
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h6 className="text-lg font-semibold text-gray-900">More Tools</h6>
            <ul className="mt-3 space-y-2 text-base text-gray-700">
              <li>
                <a
                  className="hover:text-black"
                  href="https://bodyfatestimator.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Body Fat Estimator
                </a>
              </li>
              <li>
                <a
                  className="hover:text-black"
                  href="https://ai-calorie-counter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  AI Calorie Counter
                </a>
              </li>
              <li>
                <a
                  className="hover:text-black"
                  href="https://jawlinecheck.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Jawline Check
                </a>
              </li>
              <li>
                <a
                  className="hover:text-black"
                  href="https://heightestimatorai.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Height Estimator
                </a>
              </li>
              <li>
                <a
                  className="hover:text-black"
                  href="https://canthaltilttest.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Canthal Tilt Test
                </a>
              </li>
              <li>
                <a
                  className="hover:text-black"
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

        <div className="my-8 h-px bg-gray-200" />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-gray-500">© {new Date().getFullYear()} — All Rights Reserved.</span>
          <span className="text-xs text-gray-500 max-w-2xl leading-relaxed">
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
