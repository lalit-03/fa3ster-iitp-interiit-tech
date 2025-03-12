import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SDGSlider = ({sdg}) => {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);
  
  

  const scroll = (direction) => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 rounded-xl">
      <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent pl-2 pt-2 mb-0">Sustainable Development Goals</h2>
      
      <div className="relative">
        {/* Navigation Buttons */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full shadow-lg transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full shadow-lg transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Slider Container */}
        <div
          ref={sliderRef}
          className="overflow-x-scroll scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="flex gap-6 p-4">
            {sdg.map((goal, index) => (
              <motion.div
                key={goal.sdg_number}
                className="flex-shrink-0 w-[300px] bg-gray-900 rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all cursor-pointer"
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >

                {/* Goal Description */}
                <h3 className="text-xl text-white mb-4">
                  {goal.goal_description}
                </h3>

                {/* Contribution */}
                <div className="bg-gray-700 text-xs rounded-lg p-4">
                  <p className="text-gray-300">
                    {goal.contribution}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SDGSlider;