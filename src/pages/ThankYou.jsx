import React from "react";
import { Link } from "react-router-dom";

const ThankYou = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fefefe] px-4 text-center">
      <h1 className="text-4xl font-bold text-green-600 mb-4">Thank you!</h1>
      <p className="text-lg text-gray-700 max-w-md mb-6">
        Your donation means a lot and will help someone in need. We appreciate your kindness!
      </p>
      <Link
        to="/explore"
        className="px-6 py-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition"
      >
        Back to Explore
      </Link>
    </div>
  );
};

export default ThankYou;
