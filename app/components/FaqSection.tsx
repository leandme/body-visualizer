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
  className = "mt-10 lg:mt-40",
}: FaqSectionProps) {
  const radioName = accordionName ?? `${id ?? "faq"}-accordion`;

  return (
    <div id={id} className={`hero ${className} flex items-center justify-center bg-base-100`}>
      <div className="hero-content w-full px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mt-4">{heading}</h2>

          {description ? <p className="py-6 text-lg mb-6 text-center">{description}</p> : null}

          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={`${item.question}-${idx}`} className="collapse collapse-plus border bg-base-500 rounded-lg">
                <input type="radio" name={radioName} />
                <div className="collapse-title text-lg lg:text-xl">{item.question}</div>
                <div className="collapse-content">
                  <div className="text-lg text-gray-700 leading-relaxed">{item.answer}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

