"use client"
import UploadDropzone from "../UploadDropZone";
import ReviewBox from "../ReviewBox";

export default function Hero() {
  return (
    <div className="hero min-h-screen -mt-40 flex items-center justify-center">
      <div className="hero-content flex flex-col lg:flex-row items-center gap-24 lg:gap-24">
        <img
          src="https://media.licdn.com/dms/image/v2/D4D03AQFRw62xToSYnA/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1719481327000?e=1740009600&v=beta&t=Oa3j6Nt0vWEEgBNj70Qb_f_3Q1JKgXds5HktrVPLXac"
          className="w-64 lg:w-80 rounded-lg shadow-xl"
          alt="Box Office"
        />
        <div className="text-center lg:text-left max-w-md">
          <h1 className="text-4xl font-bold">BodyVisualizer</h1>
          <p className="py-6">
            Upload an image and find out your bodyfat.
          </p>
          <UploadDropzone />
        </div>
       
      </div>
      <ReviewBox />
    </div>
  );
}
