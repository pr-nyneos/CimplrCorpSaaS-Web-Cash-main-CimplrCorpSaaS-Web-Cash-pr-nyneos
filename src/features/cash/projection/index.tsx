import { FileEdit, List } from "lucide-react";
import { useVisibleTabs } from "../../../hooks/useVisibleTabs.tsx";
import Tabs from "../../../components/layout/Tab.tsx";
import Layout from "../../../components/layout/Layout.tsx";
import AllProjection from "./AllProjection";
import ProjectionCreation from "./projectionCreation";
import { usePermissions } from "../../../hooks/useMasterPermission.tsx";
const ProjectionTab = () => {
  const visibility = usePermissions("projection");
  const TAB_CONFIG = [
    {
      id: "All",
      label: "All Projection",
      icon: List,
      visibility: visibility.allTab,
    },
    {
      id: "form",
      label: "Projection Creation",
      icon: FileEdit,
      visibility: visibility.manualEntryForm,
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
        currentContent = <AllProjection />;
        break;
      case "form":
        currentContent = <ProjectionCreation />;
        break;
      default:
        currentContent = (
          <div className="p-4 text-gray-600">No accessible tabs available.</div>
        );
        break;
    // case "add":
    //   currentContent = <ERPMapping />;
    //   break;
    //   case "Upload":
    //     currentContent = <UploadFile />;
    //     break;
    }
  }
  console.log("Active Tab:", activeTab);

  return (
    <Layout title="Projection">
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

export default ProjectionTab;