import { useLocation } from "react-router-dom";
import { useVisibleTabs } from "../../../../hooks/useVisibleTabs.tsx";
import Tabs from "../../../../components/layout/Tab.tsx";
import Layout from "../../../../components/layout/Layout.tsx";
import { List, FileEdit, UploadCloud, Contrast } from "lucide-react";

import FxConfirmationForm from "./FxConfirmationForm";
import FxConfirmationUpload from "./FxConfirmationUpload";
import PendingForwards from "./PendingForwards";
import AllForwards from "./AllForwards.tsx";

const FxConfirmationBookingTab = () => {
  const TAB_CONFIG = [
    {
      id: "All",
      label: "All Forwards",
      icon: List,
      visibility: true,
    },
    {
      id: "Pending",
      label: "Pending Forwards",
      icon: Contrast,
      visibility: true,
    },
    {
      id: "Form",
      label: "Fx Confirmation Form",
      icon: FileEdit,
      visibility: true,
    },
    {
      id: "Upload",
      label: "Fx Confirmation Upload",
      icon: UploadCloud,
      visibility: true,
    },
  ];

  const location = useLocation();
  const initialTab =
    location.state && location.state.from === "form" ? "Pending" : "Form";
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
        currentContent = <AllForwards />;
        break;
      case "Pending":
        currentContent = <PendingForwards />;
        break;
      case "Form":
        currentContent = <FxConfirmationForm />;
        break;
      case "Upload":
        currentContent = <FxConfirmationUpload />;
    }
  }

  return (
    <Layout title="Fx Confirmation">
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

export default FxConfirmationBookingTab;
