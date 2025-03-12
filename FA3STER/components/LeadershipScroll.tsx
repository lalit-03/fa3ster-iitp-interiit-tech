import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const LeadershipScroll = ({ team }) => {
  return (
    <div className="absolute right-0 top-0 w-[39%] h-[70vh] bg-gray-900 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-900/90 backdrop-blur-sm p-4 border-b border-emerald-500/20">
        <h2 className="text-emerald-400 text-lg font-semibold">Leaders</h2>
        <div className="absolute bottom-2 right-4 animate-bounce">
          <ChevronDown className="w-4 h-4 text-emerald-400/50" />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="h-full overflow-y-auto custom-scrollbar">
        <div className="space-y-6 p-4 pb-20">
          {team.map((leader, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              {/* Profile section */}
              <div className="flex items-center space-x-4 mb-3">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                  {leader.name.charAt(0)}
                </div>
                
                {/* Name and title */}
                <div>
                  <h3 className="text-white font-semibold">{leader.name}</h3>
                  <p className="text-emerald-400 text-sm">{leader.designation}</p>
                </div>
              </div>

              {/* Vision section */}
              <div className="pl-16">
                <div className="relative">
                  <div className="absolute left-[-1rem] top-0 h-full w-0.5 bg-gradient-to-b from-emerald-500 to-transparent" />
                  <p className="text-gray-400 text-xs leading-relaxed">
                    {leader.vision_for_company}
                  </p>
                </div>
              </div>

              {/* Interactive highlight */}
              <div className="absolute inset-0 bg-emerald-500/5 -m-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(16, 185, 129, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.5);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.7);
        }
      `}</style>
    </div>
  );
};

export default LeadershipScroll;