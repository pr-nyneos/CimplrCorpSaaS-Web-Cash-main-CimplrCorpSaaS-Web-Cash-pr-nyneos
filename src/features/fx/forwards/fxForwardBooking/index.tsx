import {FileEdit, UploadCloud } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useVisibleTabs } from "../../../../hooks/useVisibleTabs.tsx";
import Tabs from "../../../../components/layout/Tab.tsx";
import Layout from "../../../../components/layout/Layout.tsx";
import FxForwardBookingForm from "./FxForwardBookingForm";
import FxForwardUpload from "./FxForwardUpload";

const FxForwardBookingTab = () => {
const TAB_CONFIG = [
    {
      id: "Form",
      label: "Fx Forward Booking Form",
      icon: FileEdit,
      visibility: true,
    },
    {
      id: "Upload",
      label: "Fx Forward Upload",
      icon: UploadCloud,
      visibility: true,
    },
  ];

  const location = useLocation();
  const initialTab = location.state && location.state.from === "form" ? "form" : "All";
  const { activeTab, switchTab, isActiveTab } = useVisibleTabs(
    TAB_CONFIG,
    initialTab
  );

  let currentContent = (
    <div className="p-4 text-gray-600">No accessible tabs available.</div>
  );
  if (activeTab) {
    switch (activeTab) {
      case "Form":
        currentContent = <FxForwardBookingForm />;
        break;
      case "Upload":
        currentContent = <FxForwardUpload />;
    }
  }

  return (
    <Layout title="Fx Forward Booking">
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

export default FxForwardBookingTab;