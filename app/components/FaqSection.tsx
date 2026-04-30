import { ReactNode } from "react";

export type FaqSectionItem = {
  question: string;
  answer: ReactNode;
};

type FaqSectionProps = {
  items: FaqSectionItem[];
  heading?: string;
  description?: ReactNode;
  id?: string;
  accordionName?: string;
  className?: string;
};

export default function FaqSection({
  items,
  heading = "Frequently Asked Questions",
  description,
  id,
  accordionName,
  className = "mt-12",
}: FaqSectionProps) {
  const radioName = accordionName ?? `${id ?? "faq"}-accordion`;

  return (
    <section id={id} className={`w-full bg-white ${className}`}>
      <div className="mx-auto w-full max-w-5xl px-4">
        <h2 className="text-3xl lg:text-4xl font-bold text-center text-gray-900">{heading}</h2>
        {description ? <p className="py-6 text-lg text-center text-gray-700">{description}</p> : null}

        <div className="space-y-4">
          {items.map((item, idx) => (
            <div
              key={`${item.question}-${idx}`}
              className="collapse collapse-plus rounded-xl border border-gray-200 bg-white"
            >
              <input type="radio" name={radioName} />
              <div className="collapse-title text-lg lg:text-xl font-medium text-gray-900">{item.question}</div>
              <div className="collapse-content">
                <div className="text-lg leading-relaxed text-gray-700">{item.answer}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
