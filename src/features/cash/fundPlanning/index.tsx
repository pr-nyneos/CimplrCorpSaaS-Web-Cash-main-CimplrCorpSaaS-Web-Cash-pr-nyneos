import { FileEdit, List } from "lucide-react";
import { useVisibleTabs } from "../../../hooks/useVisibleTabs.tsx";
import Tabs from "../../../components/layout/Tab.tsx";
import Layout from "../../../components/layout/Layout.tsx";
import FundPlanning from "./FundPlanning";
import AllFundPlanningRow from "./AllFundPlanning.tsx";
// import { usePermissions } from "../../../hooks/useMasterPermission.tsx";
const FundPlanningTab = () => {
//   const visibility = usePermissions("projection");
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

  const { activeTab, switchTab, isActiveTab } = useVisibleTabs(
    TAB_CONFIG,
    "All" 
  );

  let currentContent = (
    <div className="p-4 text-gray-600">No accessible tabs available.</div>
  );
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