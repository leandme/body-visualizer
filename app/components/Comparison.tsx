export default function Comparison() {
    return (
      <div className="hero min-h-screen mt-40 lg:mt-0 flex items-center justify-center">
        <div className="w-full px-6 lg:px-12">
          <h1 className="text-3xl lg:text-5xl font-bold text-center">Interactive Body Visualization</h1>
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 mt-12">
            {/* Manual Roasting */}
            <div className="card bg-[#FFEAEC] w-full lg:w-1/3 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-center justify-center text-xl font-bold">Static Measurements</h2>
                <ul className="mt-4 space-y-4">
                  <li className="flex items-center text-neutral">
                    <span className="text-red-500 mr-2">❌</span>
                    Numbers alone can be difficult to visualize
                  </li>
                  <li className="flex items-center text-neutral">
                    <span className="text-red-500 mr-2">❌</span>
                    Manual comparisons can be inconsistent
                  </li>
                  <li className="flex items-center text-neutral">
                    <span className="text-red-500 mr-2">❌</span>
                    Goal planning can become guesswork
                  </li>
                </ul>
              </div>
            </div>
  
            {/* AI Roasting */}
            <div className="card bg-[#DEFCED] w-full lg:w-1/3 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-center justify-center text-xl font-bold">BodyVisualizer</h2>
                <ul className="mt-4 space-y-4">
                  <li className="flex items-center text-neutral">
                    <span className="text-green-500 mr-2">✅</span>
                    Upload an image and adjust your target stats
                  </li>
                  <li className="flex items-center text-neutral">
                    <span className="mr-2">✅</span>
                    Tweak body fat percentage, BMI, weight, and measurements
                  </li>
                  <li className="flex items-center text-neutral">
                    <span className="mr-2">✅</span>
                    Save and compare visual body-shape scenarios
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
