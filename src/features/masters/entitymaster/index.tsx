import { FileEdit, UploadCloud, ListTree,ChevronsLeftRightEllipsis } from "lucide-react";

import { useVisibleTabs } from "../../../hooks/useVisibleTabs.tsx";
import Tabs from "../../../components/layout/Tab.tsx";
import Layout from "../../../components/layout/Layout.tsx";
import EntityCreation from "./EntityCreation.tsx";
import HierarchicalTree from "./EntityHiearchy.tsx";
import UploadFile from "./EntityUpload.tsx";
// import AllEntityList from "./AllEntityList.tsx";

import { usePermissions } from "../../../hooks/useMasterPermission.tsx";
const CurrencyTab = () => {
  const Visibility = usePermissions("entity-master");
  const TAB_CONFIG = [
    {
      id: "form",
      label: "Entity Creation",
      icon: FileEdit,
      visibility: Visibility.manualEntryForm,
    },
    {
      id: "hierarchy",
      label: "Entities Hierarchy",
      icon: ListTree,
      visibility: Visibility.allTab,
    },
    {
      id: "Upload",
      label: "Entities Upload",
      icon: UploadCloud,
      visibility: Visibility.uploadTab,
    },
    {
      id: "add",
      label: "Entities ERP",
      icon: ChevronsLeftRightEllipsis,
      visibility: Visibility.erpTab,
    },
  ];

  const { activeTab, switchTab, isActiveTab } = useVisibleTabs(
    TAB_CONFIG,
    "Form"
  );

  let currentContent = (
    <div className="p-4 text-gray-600">No accessible tabs available.</div>
  );
  if (activeTab) {
    switch (activeTab) {
      case "form":
        currentContent = <EntityCreation />;
        break;
      case "hierarchy":
        currentContent = <HierarchicalTree />;
        break;
      case "Upload":
        currentContent = <UploadFile />;
        break;
      // case "All":
      //   currentContent = <AllEntityList />;
      //   break;
      // case "Add":
      //   currentContent = <CurrencyMaster />;
      //   break;
    }
  }

  return (
    <Layout title="Entity Master">
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

export default CurrencyTab;
