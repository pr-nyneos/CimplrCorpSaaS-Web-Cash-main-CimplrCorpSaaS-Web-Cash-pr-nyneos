import Layout from "../../../components/layout/Layout";
import Tabs from "../../../components/layout/Tab";
import { useLocation } from "react-router-dom";
import { Contrast, Users, FileEdit } from "lucide-react";
import { useVisibleTabs } from "../../../hooks/useVisibleTabs";
import AllRoles from "./AllRoles";
import RoleCreationForm from "./RoleCreationForm.tsx";
import PendingRoles from "./PendingRoles";
import LoadingSpinner from "../../../components/layout/LoadingSpinner";

const Roles = () => {
  const TAB_CONFIG = [
    {
      id: "All",
      label: "All Roles",
      icon: Users,
      visibility: true,
    },
    {
      id: "Pending",
      label: "Pending Roles",
      icon: Contrast,
      visibility: true,
    },
    {
      id: "form",
      label: "Manual Entry Form",
      icon: FileEdit,
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
   // <div className="p-4 text-gray-600">No accessible tabs available.</div>
   <LoadingSpinner />
  );
  if (activeTab) {
    switch (activeTab) {
      case "All":
        currentContent = <AllRoles />;
        break;
      case "Pending":
        currentContent = <PendingRoles />;
        break;
      case "form":
        currentContent = <RoleCreationForm />;
    }
  }

  return (
    <Layout title="All Roles">
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

export default Roles;
