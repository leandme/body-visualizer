"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

type Example = {
  id: string;
  label: string;
  sublabel?: string;
  src: string;
};

const EXAMPLES: Example[] = [
  { id: "m2", label: "Example B", sublabel: "", src: "/examples/bfe-example2.webp" },
  { id: "m3", label: "Example C", sublabel: "", src: "/examples/bfe-example3.webp" },
  { id: "m4", label: "Example D", sublabel: "", src: "/examples/bfe-example1.webp" },
  { id: "m1", label: "Example A", sublabel: "", src: "/examples/bfe-example4.webp" },
];

export default function TryExamples({ examples = EXAMPLES }: { examples?: Example[] }) {
  const router = useRouter();

  const onPick = (src: string) => {
    router.push(`/upload?imageUrl=${encodeURIComponent(src)}&source=example`);
  };

  return (
    <div className="w-full mt-10 mb-10 lg:mb-14">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="leading-tight font-bold text-base-content/70">
          <span className="inline sm:block">No photo?</span>{" "}
          <span className="inline sm:block">Try one of these:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          {examples.map((example) => (
            <button
              key={example.id}
              type="button"
              onClick={() => {
                onPick(example.src);
              }}
              className="group relative rounded-2xl bg-transparent p-[2px]"
              aria-label={`Try ${example.label}`}
            >
              <div className="overflow-hidden rounded-2xl bg-base-100 shadow-sm transition group-hover:shadow-md">
                <div className="relative h-12 w-12 overflow-hidden md:h-14 md:w-14">
                  <Image
                    src={example.src}
                    alt={example.label}
                    fill
                    className="object-cover transition-transform duration-300 ease-out group-hover:scale-110"
                    sizes="64px"
                  />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-base-content/60">
        By uploading a photo, you agree to our{" "}
        <a className="link" href="/terms">
          Terms of Service
        </a>
        . To learn more about how BodyVisualizer handles your personal data, check our{" "}
        <a className="link" href="/privacy">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}
