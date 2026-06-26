const SITE_NAME = "BodyVisualizer";
const LOGO_SRC = "/logo.png";

export default function Navbar() {
  return (
    <div className="navbar bg-base-100 px-2 sm:px-4 lg:sticky top-0 z-50 border-b border-base-200">
      <div className="navbar-start min-w-0">
        <a
          className="btn btn-ghost font-heading text-xl flex items-center gap-2 hover:bg-transparent focus:bg-transparent active:bg-transparent"
          href="/"
        >
          <img src={LOGO_SRC} alt="BodyVisualizer Logo" className="w-6 h-6" />
          {SITE_NAME}
        </a>
        <div className="hidden lg:flex ml-4 xl:ml-8">
          <ul className="menu menu-horizontal px-1 gap-2 xl:gap-4 text-base whitespace-nowrap flex-nowrap">
            <li>
              <a
                href="/pricing"
                className="font-normal hover:bg-transparent focus:bg-transparent active:bg-transparent"
              >
                Pricing
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="navbar-end lg:hidden">
        <a className="btn btn-ghost text-base" href="/pricing">
          Pricing
        </a>
      </div>
    </div>
  );
}
