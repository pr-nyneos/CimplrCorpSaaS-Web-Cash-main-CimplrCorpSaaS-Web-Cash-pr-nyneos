import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

// const API_KEY = "7e7d6d0df8d84cd09c21218e46c6f3ab";
const BASE = "USD";

// Expanded currency list to support 2 full rows
const CURRENCIES = [
  "INR",
  "EUR",
  "JPY",
  "GBP",
  "AUD",
  "CAD",
  "CHF",
  "CNY",
  "HKD",
  "NZD",
];

interface RateData {
  current: number;
  previous: number;
  percentChange: number;
  direction: "up" | "down" | "neutral";
}

const FXTickerCompact = () => {
  const [rates, setRates] = useState<Record<string, RateData>>({});
  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const rowCount = 2;
  const rowSize = 5; // 5 currencies per row for better display

  const generateMockRates = () => {
    const mockRates: Record<string, RateData> = {};
    CURRENCIES.forEach((symbol) => {
      const current = 1 + Math.random() * 100;
      const percentChange = (Math.random() - 0.5) * 10;
      mockRates[symbol] = {
        current,
        previous: current,
        percentChange,
        direction:
          percentChange > 0.01
            ? "up"
            : percentChange < -0.01
            ? "down"
            : "neutral",
      };
    });
    setRates(mockRates);
  };

  const triggerTransition = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentRowIndex((prev) => (prev + 1) % rowCount);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    }, 300); // Half of transition duration
  };

  useEffect(() => {
    generateMockRates();
    const intervalFetch = setInterval(generateMockRates, 15000);
    return () => clearInterval(intervalFetch);
  }, []);

  useEffect(() => {
    const intervalSlide = setInterval(triggerTransition, 10000);
    return () => clearInterval(intervalSlide);
  }, []);

  const rows: string[][] = [];
  for (let i = 0; i < rowCount; i++) {
    rows.push(CURRENCIES.slice(i * rowSize, (i + 1) * rowSize));
  }

  const renderRow = (row: string[], rowIndex: number) => {
    const isCurrent = rowIndex === currentRowIndex;
    const isNext = rowIndex === (currentRowIndex + 1) % rowCount;

    // Only render current and next rows for performance
    if (!isCurrent && !isNext) return null;

    let transform = "";
    let opacity = "";

    if (isCurrent) {
      transform = isTransitioning ? "translateY(-100%)" : "translateY(0)";
      opacity = isTransitioning ? "0" : "1";
    } else if (isNext) {
      transform = isTransitioning ? "translateY(0)" : "translateY(100%)";
      opacity = isTransitioning ? "1" : "0";
    }

    return (
      <div
        key={rowIndex}
        className="absolute inset-0 flex items-center px-3 space-x-4 w-full h-full transition-all duration-500 ease-in-out"
        style={{
          transform,
          opacity: parseFloat(opacity),
        }}
      >
        {row.map((symbol) => {
          const data = rates[symbol];
          if (!data) return null;

          const { current, percentChange, direction } = data;
          const color =
            direction === "up"
              ? "text-green-600"
              : direction === "down"
              ? "text-red-500"
              : "text-gray-600";

          return (
            <div
              key={symbol}
              className="flex flex-col items-center  w-16 flex-shrink-0"
            >
              <span
                className={`text-[11px] font-medium text-secondary-text-dark leading-none ${color}`}
              >
                {current.toFixed(4)}
              </span>
              <span className="text-[12px] pt-0.5 tracking-widest text-primary font-semibold leading-none">
                {`${BASE}/${symbol}`}
              </span>
              <span
                className={`text-[10px] font-medium flex items-center gap-1 ${
                  direction === "up"
                    ? "text-green-600"
                    : direction === "down"
                    ? "text-red-500"
                    : "text-gray-600"
                }`}
              >
                {percentChange.toFixed(2)}%
                {direction === "up" && <TrendingUp className="w-3 h-3" />}
                {direction === "down" && <TrendingDown className="w-3 h-3" />}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative overflow-hidden h-14 w-full max-w-[410px] ml-6 my-2 rounded border border-border shadow-sm bg-secondary-color-lt z-40">
      {rows.map((row, idx) => renderRow(row, idx))}

      {/* Progress indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-px ">
        <div
          className="h-full bg-primary transition-all duration-500 ease-linear"
          style={{
            width: isTransitioning ? "150%" : "0%",
          }}
        />
      </div>
    </div>
  );
};

export default FXTickerCompact;
