import { FileEdit, List } from "lucide-react";
import { useVisibleTabs } from "../../../hooks/useVisibleTabs.tsx";
import Tabs from "../../../components/layout/Tab.tsx";
import Layout from "../../../components/layout/Layout.tsx";
import FundPlanning from "./FundPlanning";
import AllFundPlanningRow from "./AllFundPlanning.tsx";
import { usePermissions } from "../../../hooks/useMasterPermission";
import LoadingSpinner from "../../../components/layout/LoadingSpinner.tsx";
import { useLocation } from "react-router-dom";
// import { usePermissions } from "../../../hooks/useMasterPermission.tsx";
const FundPlanningTab = () => {
    const location = useLocation();
 const visibility = usePermissions("fund-planning");
  const TAB_CONFIG = [
    {
      id: "All",
      label: "All Fund Planning",
      icon: List,
      visibility: true,
    },
    {
      id: "form",
      label: "Fund Planning",
      icon: FileEdit,
      visibility: true,
    },
    // {
    //   id: "Upload",
    //   label: "Currency Upload",
    //   icon: UploadCloud,
    //   visibility: true,
    // },
    // {
    //   id: "add",
    //   label: "Currency ERP",
    //   icon: ChevronsLeftRightEllipsis,
    //   visibility: true,
    // },
  ];

  const initialTab =
    location.state && location.state.from === "form" ? "form" : "All";
  const { activeTab, switchTab, isActiveTab } = useVisibleTabs(
    TAB_CONFIG,
    initialTab
  );

 if (!visibility) {
    return <LoadingSpinner />;
  }

  
 
let currentContent = <LoadingSpinner />;
  if (activeTab) {
    switch (activeTab) {
      case "All":
        currentContent = <AllFundPlanningRow />;
        break;
      case "form":
        currentContent = <FundPlanning />;
        break;
    //   case "Upload":
    //     currentContent = <UploadFile />;
    //     break;
    default:
        currentContent = (
          <div className="p-4 text-gray-600">No tab available</div>
        );
        break;
    }
  }

  return (
    <Layout title="Fund Planning">
      <div className="mb-6 pt-4">
        <Tabs
          tabs={TAB_CONFIG}
          switchTab={switchTab}
          isActiveTab={isActiveTab}
        />
      </div>
      <div className="transition-opacity duration-300">{currentContent}</div>
    </Layout>
  );
};

export default FundPlanningTab;