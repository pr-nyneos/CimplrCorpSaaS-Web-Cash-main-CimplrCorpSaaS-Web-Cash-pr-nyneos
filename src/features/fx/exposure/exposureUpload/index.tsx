import Layout from "../../../../components/layout/Layout.tsx";
import Tabs from "../../../../components/layout/Tab.tsx";
import { useLocation } from "react-router-dom";
import { Contrast, Users, UploadCloud } from "lucide-react";
import { useVisibleTabs } from "../../../../hooks/useVisibleTabs.tsx";
import AllExposureRequests from "./AllExposureRequest.tsx";
import PendingExposureRequests from "./PendingExposureRequest.tsx";
import ExposureUploadForm from "./AddExposure";

const ExposureUploadTab = () => {
  const TAB_CONFIG = [
    {
      id: "All",
      label: "All Exposure Requests",
      icon: Users,
      visibility: true,
    },
    {
      id: "Pending",
      label: "Pending Exposure Requests",
      icon: Contrast,
      visibility: true,
    },
    {
      id: "Upload",
      label: "Exposure Upload",
      icon: UploadCloud,
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
        currentContent = <AllExposureRequests />;
        break;
      case "Pending":
        currentContent = <PendingExposureRequests />;
        break;
      case "Upload":
        currentContent = <ExposureUploadForm />;
    }
  }

  return (
    <Layout title="Exposure Upload">
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

export default ExposureUploadTab;
