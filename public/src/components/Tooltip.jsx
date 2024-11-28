import React from 'react';
import { AiOutlineClose } from 'react-icons/ai';

const Tooltip = ({ message, onClose }) => {
  return (
    <div className="absolute bottom-full mb-3 z-10 w-72 "> {/* Increased width for better paragraph layout */}
      <div className="relative bg-gray-200 text-gray-800 text-sm rounded-lg py-2  px-4 shadow-lg leading-relaxed">
        <p className="mb-2">{message}</p> {/* Wrapped message in a paragraph for better spacing */}
        {/* Close Button */}
        {/* <button
          onClick={onClose}
          className="absolute top-1 right-1 text-gray-400 hover:text-white focus:outline-none"
          aria-label="Close tooltip"
        >
          <AiOutlineClose className="h-4 w-4" />
        </button> */}
      </div>
      {/* Tooltip Arrow */}
    </div>
  );
};

export default Tooltip;
