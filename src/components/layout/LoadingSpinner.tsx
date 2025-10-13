const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="relative">
      <div className="w-12 h-12 border-4 border-primary-lg border-t-primary rounded-full animate-spin"></div>
      <div className="mt-4 text-center">
        <p className="relative -left-6 text-primary font-medium">Loading data...</p>
      </div>
    </div>
  </div>
);

export default LoadingSpinner;