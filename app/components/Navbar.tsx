const SITE_NAME = "Body Visualizer";
const LOGO_SRC = "/favicon.ico";

export default function Navbar() {
  return (
    <div className="navbar bg-base-100 px-2 sm:px-4 lg:sticky top-0 z-50 border-b border-base-200">
      <div className="navbar-start min-w-0">
        <a
          className="btn btn-ghost font-heading text-xl flex items-center gap-2 hover:bg-transparent focus:bg-transparent active:bg-transparent"
          href="/"
        >
          <img src={LOGO_SRC} alt="Body Visualizer Logo" className="w-6 h-6" />
          {SITE_NAME}
        </a>
      </div>
    </div>
  );
}
