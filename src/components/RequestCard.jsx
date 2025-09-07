import React from "react";

const RequestCard = ({ request }) => {
  const { title, category, amountNeeded, description, requesterName } = request;

  return (
    <div className="border rounded-lg p-4 shadow-md hover:shadow-lg transition cursor-pointer max-w-md mx-auto bg-white">
      <h2 className="text-xl font-semibold text-[#f97316] mb-2">{title}</h2>
      <p className="text-sm text-gray-500 mb-1"><strong>Category:</strong> {category}</p>
      <p className="text-sm text-gray-700 mb-3">{description}</p>
      <p className="text-base font-medium text-gray-900">
        <span className="font-semibold">Amount Needed:</span> ${amountNeeded}
      </p>
      <p className="text-sm text-gray-600 mt-2">Requested by: {requesterName || "Anonymous"}</p>
    </div>
  );
};

export default RequestCard;
