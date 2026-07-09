import TrackedPricingLink from "@/app/components/common/tracked-pricing-link";
import BodyVisualizerAccessLink from "@/app/components/common/body-visualizer-access-link";
import { Menu } from "lucide-react";

const SITE_NAME = "Body Visualizer";
const LOGO_SRC = "/logo.png";

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
        <div className="hidden lg:flex ml-4 xl:ml-8">
          <ul className="menu menu-horizontal px-1 gap-2 xl:gap-4 text-base whitespace-nowrap flex-nowrap">
            <li>
              <TrackedPricingLink
                location="Header"
                className="font-normal hover:bg-transparent focus:bg-transparent active:bg-transparent"
              >
                Pricing
              </TrackedPricingLink>
            </li>
          </ul>
        </div>
      </div>
      <div className="navbar-end hidden lg:flex">
        <BodyVisualizerAccessLink
          location="Header"
          className="btn btn-primary text-base font-bold text-white"
        >
          Body Visualizer
        </BodyVisualizerAccessLink>
      </div>
      <div className="navbar-end lg:hidden">
        <div className="dropdown dropdown-end">
          <button
            type="button"
            tabIndex={0}
            className="btn btn-ghost btn-square"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <ul
            tabIndex={0}
            className="menu dropdown-content z-[60] mt-3 w-56 rounded-box bg-base-100 p-2 shadow-xl"
          >
            <li>
              <TrackedPricingLink location="Header">
                Pricing
              </TrackedPricingLink>
            </li>
            <li>
              <BodyVisualizerAccessLink location="Header">
                Body Visualizer
              </BodyVisualizerAccessLink>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
