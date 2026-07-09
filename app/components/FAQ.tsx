export default function FAQ() {
  return (
    <div id="faq" className="hero mt-10 lg:mt-40 flex items-center justify-center bg-base-100">
      <div className="hero-content w-full px-4">
        <div className="max-w-5xl mx-auto">
          {/* Heading */}
          <h2 className="text-xl lg:text-4xl text-center font-bold">
            Frequently Asked Questions
          </h2>
          <p className="py-6 text-lg mb-6 text-center">
          Have another question? Reach out to our support team by sending us an <a href="mailto:bodyfatestimator@gmail.com" className="text-primary">email</a> and we’ll get back to you as soon as we can.
          </p>

          {/* FAQ Items */}
          <div className="space-y-4">
            <div className="collapse collapse-plus bg-base-500 rounded-lg">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-lg lg:text-xl">
                What is Body Visualizer?
              </div>
              <div className="collapse-content">
                <p className="text-lg">
                Body Visualizer is an interactive model that shows how body shape may change when you adjust body fat,
                BMI, height, and weight.
                </p>
              </div>
            </div>
            <div className="collapse collapse-plus bg-base-500 rounded-lg">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-lg lg:text-xl">
                Do I need to upload a photo?
              </div>
              <div className="collapse-content">
                <p className="text-lg">
                  The intended Body Visualizer AI workflow starts with a full-body photo, then lets you adjust body fat,
                  BMI, weight, and measurements.
                </p>
              </div>
            </div>
            <div className="collapse collapse-plus bg-base-500 rounded-lg">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-lg lg:text-xl">
                How accurate is it?
              </div>
              <div className="collapse-content">
                <p className="text-lg">
                  It is designed for directional scenario testing and trend context, not clinical measurement. Use it
                  alongside consistent real-world tracking.
                </p>
              </div>
            </div>
            <div className="collapse collapse-plus bg-base-500 rounded-lg">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-lg lg:text-xl">
                What is Linked mode vs Independent mode?
              </div>
              <div className="collapse-content">
                <p className="text-lg">
                  Linked mode keeps BMI and body-fat sliders synchronized. Independent mode lets you move each slider
                  manually for custom what-if comparisons.
                </p>
              </div>
            </div>
            <div className="collapse collapse-plus bg-base-500 rounded-lg">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-lg lg:text-xl">
                Can I use imperial and metric units?
              </div>
              <div className="collapse-content">
                <p className="text-lg">
                  Yes. You can switch between imperial and metric units at any time and continue testing scenarios in
                  whichever format you prefer.
                </p>
              </div>
            </div>
            <div className="collapse collapse-plus bg-base-500 rounded-lg">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-lg lg:text-xl">
                I have another question...
              </div>
              <div className="collapse-content">
                <p className="text-lg">
                  No worries! Contact me via <a href="mailto:bodyfatestimator@gmail.com" className="text-primary">
            email.
          </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
