import { useVisibleTabs } from "../../../hooks/useVisibleTabs";
import Tabs from "../../../components/layout/Tab";
import { Contrast, FileEdit, UploadCloud } from "lucide-react";

import Layout from "../../../components/layout/Layout";
import ProposalUpload from "./ProposalUpload";
import ProposalForm from "./ProposalForm";
import ProposalSplit from "./ProposalSplit";
import LoadingSpinner from "../../../components/layout/LoadingSpinner";
import { useLocation } from "react-router-dom";
import { usePermissions } from "../../../hooks/useMasterPermission";

const ProposalScreen = () => {
   const location = useLocation();
    const visibility = usePermissions("proposal");
  const TAB_CONFIG = [
    {
      id: "Form",
      label: "Proposal Manual Entry",
      icon: FileEdit,
      visibility: true,
    },
    {
      id: "Upload",
      label: "Proposal Upload",
      icon: UploadCloud,
      visibility: true,
    },
    {
      id: "split",
      label: "Proposal Split",
      icon: Contrast,
      visibility: true,
    },
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
      case "Form":
        currentContent = <ProposalForm />;
        break;
      case "Upload":
        currentContent = <ProposalUpload />;
        break;
      case "split":
        currentContent = <ProposalSplit />;
        break;
        default:
        currentContent = (
          <div className="p-4 text-gray-600">No tab available</div>
        );
        break;
    }
  }

  return (
    <Layout title="Cash Transaction Upload" showButton={false}>
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

export default ProposalScreen;
