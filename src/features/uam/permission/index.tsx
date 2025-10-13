import Layout from "../../../components/layout/Layout";
import Tabs from "../../../components/layout/Tab";
import { useLocation } from "react-router-dom";
import { Contrast, FileEdit } from "lucide-react";
import { useVisibleTabs } from "../../../hooks/useVisibleTabs";
// import AllRoles from "./AllRoles";
import AwaitingPermission from "./PendingPermission";
import PermissionCreation from "./PermissionCreation";
import LoadingSpinner from "../../../components/layout/LoadingSpinner";

const Permission = () => {
  const TAB_CONFIG = [
    {
      id: "Awaiting",
      label: "Pending Permissions",
      icon: Contrast,
      visibility: true,
    },
    {
      id: "form",
      label: "Assign Permission",
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
    //<div className="p-4 text-gray-600">No accessible tabs available.</div>
    <LoadingSpinner />
  );
  if (activeTab) {
    switch (activeTab) {
        case "Awaiting":
          currentContent = <AwaitingPermission />;
          break;
      case "form":
        currentContent = <PermissionCreation />;
    }
  }

  return (
    <Layout title="Assign Permission">
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

export default Permission;
