type TabsProps = {
  tabs: {
    id: string;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    visibility: boolean;
  }[];
  switchTab: (tab: string) => void;
  isActiveTab: (tab: string) => boolean;
};

const Tabs = ({ tabs, switchTab, isActiveTab }: TabsProps) => {
  const visibleTabs = tabs.filter(t => t.visibility);

  if (visibleTabs.length === 0) {
    return <div className="p-4 text-primary">You don't have access to any tabs.</div>;
  }

  return (
    <div className="flex space-x-1 border-b border-primary-lg">
      {visibleTabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => switchTab(tab.id)}
          className={`
            flex items-center space-x-2 px-6 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-all duration-200
            ${isActiveTab(tab.id)
              ? "bg-primary-lt text-white border-primary shadow-sm"
              : "bg-body-hover text-secondary-text border-body-hover hover:bg-body-active hover:text-primary"}
          `}
        >
          <tab.icon size={20} className="mr-2" />
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
