
import { useNavigate } from "react-router-dom";


interface StatCardProps {
  title: string;
  value: string;
  bgColor: string;
  drillPath?: string;       
  withFilter?: boolean;
  scrollable?: boolean;
  state?: any;
}

const StatCard = ({ title, value, bgColor, drillPath, withFilter, state }: StatCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!drillPath) return;
    if (withFilter) {
      navigate(drillPath, { state });
    } else {
      navigate(drillPath);
    }
  };
  return(
  <div
  onClick={handleClick}
    className={`
      ${bgColor}
      text-secondary-color rounded-2xl shadow-md p-4 w-full relative my-2
      active:scale-95 active:shadow-md
      cursor-pointer hover:scale-105 transition-all duration-200 ease-in-out 
    `}
  >
    {/* Decorative SVG */}
    <div className="absolute inset-0 opacity-20 pointer-events-none">
      <svg className="w-full h-full" width="100%" height="100%">
        <defs>
          <pattern
            id="grid-pattern"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
      </svg>
    </div>

    <div className="relative z-10 flex flex-col h-full pb-6 justify-between">
      <div className="mb-2 flex items-start min-h-[3.5rem]">
        <h2
          className="font-medium text-xl text-left text-white leading-tight break-words line-clamp-2 max-w-[14rem] min-h-[2.7rem]"
          title={title}
        >
          {title}
        </h2>
      </div>
      <div className="flex justify-center mt-2 items-end flex-1">
        <span className="text-3xl md:text-4xl font-bold text-white relative -top-2">{value}</span>
      </div>
    </div>
  </div>
)
};

export default StatCard;