import React from 'react';

const Card = ({ icon, title, value }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
      <div className="bg-brand-pink-light p-3 rounded-full">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-brand-dark">{value}</p>
      </div>
    </div>
  );
};

export default Card;
