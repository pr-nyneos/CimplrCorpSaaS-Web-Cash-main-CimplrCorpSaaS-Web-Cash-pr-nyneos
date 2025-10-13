import Layout from "../../../../components/layout/Layout.tsx";
import Tabs from "../../../../components/layout/Tab.tsx";
import { useLocation } from "react-router-dom";
import { Contrast, Users } from "lucide-react";
import { useVisibleTabs } from "../../../../hooks/useVisibleTabs.tsx";
import ExposureBucketing from "./ExposureBucketing.tsx";
import PendingExposureBucketing from "./PendingExposureBucketing";

const ExposureBucketingTab = () => {
  const TAB_CONFIG = [
    {
      id: "All",
      label: "All Exposure Bucketing",
      icon: Users,
      visibility: true,
    },
    {
      id: "Pending",
      label: "Pending Exposure Bucketing",
      icon: Contrast,
      visibility: true,
    },
  ];

  const location = useLocation();
  const initialTab =
    location.state && location.state.from === "form" ? "form" : "All";
  const { activeTab, switchTab, isActiveTab } = useVisibleTabs(
    TAB_CONFIG,
    initialTab
  );

  let currentContent = (
    <div className="p-4 text-gray-600">No accessible tabs available.</div>
  );
  if (activeTab) {
    switch (activeTab) {
      case "All":
        currentContent = <ExposureBucketing />;
        break;
      case "Pending":
        currentContent = <PendingExposureBucketing />;
        break;
    }
  }

  return (
    <Layout title="Exposure Bucketing">
      <div className="mb-6 pt-4">
        <Tabs
          tabs={TAB_CONFIG}
          // activeTab={activeTab}
          switchTab={switchTab}
          isActiveTab={isActiveTab}
        />
      </div>
      <div className="transition-opacity duration-300">{currentContent}</div>
    </Layout>
  );
};

export default ExposureBucketingTab;
