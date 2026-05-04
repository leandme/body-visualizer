export default function Footer() {
  return (
    <footer className="bg-[#18181b] text-white">
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
          <p className="mt-3 text-base leading-relaxed text-gray-300">
            Visualize unique body shapes instantly. Input BMI, height, weight, body fat % and body measurements to generate a lifelike 3D avatar.
          </p>
        </div>

        <div className="my-8 h-px bg-white/10" />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-gray-400">© {new Date().getFullYear()} Body Visualizer — All Rights Reserved.</span>
        </div>
      </div>
    </footer>
  );
}
