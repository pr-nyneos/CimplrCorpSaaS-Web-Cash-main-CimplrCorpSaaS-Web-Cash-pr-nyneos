import { useEffect, useState } from "react";
import { Suspense } from "react";
import LoadingSpinner from "../../../components/layout/LoadingSpinner";
import TableContent from "./TableContent";
import nos from "../../../utils/nos";
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

interface PermissionData {
  roleName: string;
  status: string;
}

const AwaitingPermission: React.FC = () => {
  const [data, setData] = useState<PermissionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSelected] = useState<boolean>(true);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await nos.post<any>(
          `${apiBaseUrl}/uam/permissions/approve-reject`
        );
         console.log(response.data.rolesStatus);
        setData(response.data.rolesStatus);
        setLoading(false);
      } catch (error) {
         console.error("Error fetching roles:", error);
        setLoading(false);
      }
    };
    fetchRoles();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TableContent
        data={data}
        searchTerm={searchTerm}
        showSelected={showSelected}
        onSearchChange={setSearchTerm}
        isPending={true} 
      />
    </Suspense>
  );
};

export default AwaitingPermission;
