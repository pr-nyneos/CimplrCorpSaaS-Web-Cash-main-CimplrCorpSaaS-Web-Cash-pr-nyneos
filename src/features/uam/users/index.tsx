import Layout from "../../../components/layout/Layout";
import Tabs from "../../../components/layout/Tab";
import { useLocation } from "react-router-dom";
import { Contrast, Users, FileEdit } from "lucide-react";
import { useVisibleTabs } from "../../../hooks/useVisibleTabs";
import AllUsers from "./AllUser";
import UserCreationForm from "./UserCreationForm";
import PendingUsers from "./PendingUsers";

const User = () => {
  const TAB_CONFIG = [
    {
      id: "All",
      label: "All Users",
      icon: Users,
      visibility: true,
    },
    {
      id: "Pending",
      label: "Pending Users",
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
    <div className="p-4 text-gray-600">No accessible tabs available.</div>
  );
  if (activeTab) {
    switch (activeTab) {
      case "All":
        currentContent = <AllUsers />;
        break;
      case "Pending":
        currentContent = <PendingUsers />;
        break;
      case "form":
        currentContent = <UserCreationForm />;
    }
  }

  return (
    <Layout title="All Users">
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

export default User;
