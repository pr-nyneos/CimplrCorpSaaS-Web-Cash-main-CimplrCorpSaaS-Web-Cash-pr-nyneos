import React, { useEffect, useState } from "react";
import LoadingSpinner from "../../../components/layout/LoadingSpinner.tsx";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
import Button from "../../../components/ui/Button.tsx";
import TreeNode from "../../../components/hierarchy/Hierarcy.tsx";
import InputGroup from "../../../components/ui/InputGroup.tsx";
import DropdownGroup from "../../../components/ui/DropdownGroup.tsx";
import { useForm } from "react-hook-form";
import type { CashFlowCategory } from "../../../types/masterType";
import nos from "../../../utils/nos.tsx";
import { Trash2 } from "lucide-react";
import { useAllTabPermissions } from "../../../hooks/useAllTabPermission.tsx";
type ApprovalStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "PENDING_DELETE_APPROVAL"
  | "PENDING_EDIT_APPROVAL"
  | "CANCELLED";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

type APIResponse = {
  success: boolean;
  updated?: { success: boolean; error?: string }[];
  results?: { success: boolean; error?: string }[];

  error?: string;
};

// type TabVisibility = {
//   approve: boolean;
//   reject: boolean;
//   edit: boolean;
// };

export type TreeNodeType = {
  id: string;
  name: string;
  data: CashFlowCategory;
  children?: TreeNodeType[];
};

const AllCostProfitCenters = () => {
  // const [approvalComment, setApprovalComment] = useState("");
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [selectedNode, setSelectedNode] = useState<TreeNodeType | null>(null);
  // const [Visibility, ] = useState<TabVisibility>({
  //   approve: true,
  //   reject: true,
  //   edit: true,
  // });
  const [loading, setLoading] = useState(true);

  // const { notify, confirm } = useNotification();
  const [treeData, setTreeData] = useState<
    TreeNodeType | TreeNodeType[] | null
  >(null);
  console.log("DATA:", treeData);
  const { notify, confirm } = useNotification();
  const visibility = useAllTabPermissions("cashflow-category-master");

  useEffect(() => {
    const syncAndFetchHierarchy = async () => {
      try {
        // await axios.post(`${apiBaseUrl}/entity/sync-relationships`);
        const response = await nos.post<TreeNodeType[]>(
          `${apiBaseUrl}/master/v2/cashflow-category/hierarchy`
        );
        if (response.data && response.data.length > 0) {
          setTreeData(response.data);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    syncAndFetchHierarchy();
  }, []);

  const findNodeByIdUniversal = (
    node: TreeNodeType | TreeNodeType[],
    nodeId: string
  ): TreeNodeType | null => {
    if (Array.isArray(node)) {
      for (const n of node) {
        const found = findNodeByIdUniversal(n, nodeId);
        if (found) return found;
      }
      return null;
    }
    if (node.id === nodeId) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findNodeByIdUniversal(child, nodeId);
        if (found) return found;
      }
    }
    return null;
  };

  const getAllNodeIds = (
    node: TreeNodeType | TreeNodeType[] | null
  ): string[] => {
    if (!node) return [];

    if (Array.isArray(node)) {
      return node.flatMap((n) => {
        const ids = [n.id];
        if (n.children) {
          ids.push(...getAllNodeIds(n.children));
        }
        return ids;
      });
    }

    const ids = [node.id];
    if (node.children) {
      node.children.forEach((child) => {
        ids.push(...getAllNodeIds(child));
      });
    }
    return ids;
  };

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (treeData && selectedNode) {
      const node = findNodeByIdUniversal(treeData, selectedNode.id);
      setSelectedNode(node || null);
    }
  }, [treeData, selectedNode?.id]);

  useEffect(() => {
    if (treeData) {
      if (isAllExpanded) {
        const allNodeIds = getAllNodeIds(treeData);
        setExpandedNodes(new Set(allNodeIds));
      } else {
        setExpandedNodes(new Set());
      }
    }
  }, [treeData, isAllExpanded]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      newSet.has(nodeId) ? newSet.delete(nodeId) : newSet.add(nodeId);
      return newSet;
    });
  };

  const toggleAllNodes = () => {
    if (isAllExpanded) {
      setExpandedNodes(new Set());
    } else {
      const allNodeIds = getAllNodeIds(treeData);
      setExpandedNodes(new Set(allNodeIds));
    }
    setIsAllExpanded(!isAllExpanded);
  };

  const deleteNode = (
    nodeId: string,
    currentNode: TreeNodeType | TreeNodeType[] | null
  ): TreeNodeType | TreeNodeType[] | null => {
    if (!currentNode) return null;
    if (Array.isArray(currentNode)) {
      const pruned = currentNode
        .map((child) => deleteNode(nodeId, child))
        .filter((child): child is TreeNodeType => child !== null);
      return pruned;
    }
    if (currentNode.id === nodeId) return null;
    if (currentNode.children) {
      const updatedChildren = currentNode.children
        .map((child) => deleteNode(nodeId, child) as TreeNodeType | null)
        .filter((child): child is TreeNodeType => child !== null);
      return {
        ...currentNode,
        children: updatedChildren.length > 0 ? updatedChildren : undefined,
      };
    }
    return currentNode;
  };

  const updateApprovalStatus = (nodeId: string, status: ApprovalStatus) => {
    const setStatusForAllDescendants = (
      node: TreeNodeType,
      status: ApprovalStatus
    ): TreeNodeType => ({
      ...node,
      data: {
        ...node.data,
        processing_status: status,
      },
      children: node.children?.map((child) =>
        setStatusForAllDescendants(child, status)
      ),
    });

    const updateStatus = (node: TreeNodeType): TreeNodeType => {
      if (node.id === nodeId) {
        if (status === "REJECTED") {
          return setStatusForAllDescendants(node, "REJECTED");
        } else {
          return {
            ...node,
            data: {
              ...node.data,
              processing_status: status,
            },
          };
        }
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(updateStatus),
        };
      }
      return node;
    };

    if (Array.isArray(treeData)) {
      // setTreeData(treeData.map(updateStatus));
    } else if (treeData) {
      setTreeData(updateStatus(treeData));
    }
  };

  interface CategoryDetailsProps {
    category: {
      data: CashFlowCategory;
    };
    onUpdateCategory: (updatedData: CashFlowCategory) => void;
  }

  const CategoryDetails = ({
    category,
    onUpdateCategory,
  }: CategoryDetailsProps) => {
    const [editing, setEditing] = React.useState(false);

    const {
      register,
      handleSubmit,
      reset,
      formState: { errors },
      watch,
    } = useForm<CashFlowCategory>({
      defaultValues: {
        category_id: category.data.category_id || "",
        category_name: category.data.category_name || "",
        category_type: category.data.category_type || "",
        parent_category_id: category.data.parent_category_id || "",
        default_mapping: category.data.default_mapping || "",
        cashflow_nature: category.data.cashflow_nature || "",
        usage_flag: category.data.usage_flag || "",
        description: category.data.description || "",
        status: category.data.status || "",
        category_level: category.data.category_level || 0,
        processing_status: category.data.processing_status || "",
        requested_by: category.data.requested_by || "",
        requested_at: category.data.requested_at || "",
        checker_by: category.data.checker_by || "",
        checker_at: category.data.checker_at || "",
        checker_comment: category.data.checker_comment || "",
        reason: category.data.reason || "",
        created_by: category.data.created_by || "",
        created_at: category.data.created_at || "",
        edited_by: category.data.edited_by || "",
        edited_at: category.data.edited_at || "",
        deleted_by: category.data.deleted_by || "",
        deleted_at: category.data.deleted_at || "",
      },
    });

    useEffect(() => {
      reset({
        category_id: category.data.category_id || "",
        category_name: category.data.category_name || "",
        category_type: category.data.category_type || "",
        parent_category_id: category.data.parent_category_id || "",
        default_mapping: category.data.default_mapping || "",
        cashflow_nature: category.data.cashflow_nature || "",
        usage_flag: category.data.usage_flag || "",
        description: category.data.description || "",
        status: category.data.status || "",
        category_level: category.data.category_level || 0,
        processing_status: category.data.processing_status || "",
        requested_by: category.data.requested_by || "",
        requested_at: category.data.requested_at || "",
        checker_by: category.data.checker_by || "",
        checker_at: category.data.checker_at || "",
        checker_comment: category.data.checker_comment || "",
        reason: category.data.reason || "",
        created_by: category.data.created_by || "",
        created_at: category.data.created_at || "",
        edited_by: category.data.edited_by || "",
        edited_at: category.data.edited_at || "",
        deleted_by: category.data.deleted_by || "",
        deleted_at: category.data.deleted_at || "",
      });
      setEditing(false);
    }, [category, reset]);

    const handleSave = async (data: CashFlowCategory) => {
      const result = await confirm(
        `Are you sure you want to approve ${category.data.category_name}`,
        {
          input: true,
          inputLabel: "Approve Comments (optional)",
          inputPlaceholder: "Enter comments...",
        }
      );
      if (!result.confirmed) return;

      function getChangedFields<T extends object>(
        original: T,
        updated: Partial<T>
      ): Partial<T> {
        return (Object.keys(updated) as Array<keyof T>).reduce((acc, key) => {
          if (updated[key] !== original[key]) {
            acc[key] = updated[key];
          }
          return acc;
        }, {} as Partial<T>);
      }

      // Usage:
      const changedFields = getChangedFields(category.data, data);

      const payload = {
        categories: [
          {
            category_id: category.data.category_id,
            fields: changedFields,
            reason: result.inputValue || "",
          },
        ],
      };

      try {
        // Simulate API call
        const response = await nos.post<APIResponse>(
          `${apiBaseUrl}/master/cashflow-category/updatebulk`,
          payload
        );

        if (response.data.results && response.data.results[0].success) {
          notify(
            `${category.data.category_name} updated successfully!`,
            "success"
          );
          onUpdateCategory(data);
          setEditing(false);
        } else {
          notify(
            response.data?.results?.[0]?.error || "Update failed",
            "error"
          );
        }
      } catch (error) {
        notify(
          "Failed to update category. Please check your input or try again later.",
          "error"
        );
      }
    };

    // Define options for dropdowns
    const cashflowNatureOptions = ["Inflow", "Outflow", "Neutral"];
    const categoryTypeOptions = [
      "Income",
      "Expense",
      "Asset",
      "Liability",
      "Equity",
    ];
    const statusOptions = ["Active", "Pending", "Rejected", "In Review"];
    const usageFlagOptions = ["Yes", "No"];
    const defaultMappingOptions = ["Automatic", "Manual"];
    const processingStatusOptions = [
      "Pending",
      "Approved",
      "Rejected",
      "In Progress",
    ];

    return (
      <div className="bg-secondary-color rounded-lg border border-border p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl text-primary font-bold">
            {category.data.category_name + ` Category Details` ||
              "Category Details"}
          </h2>

          <div className="w-[5rem] flex justify-end gap-2">
            {visibility.delete && (
              <Button
                categories="Medium"
                color="Fade"
                onClick={() =>
                  handleDelete(
                    category.data.category_id,
                    category.data.category_name
                  )
                }
              >
                <Trash2 size={18} color="red" />
              </Button>
            )}

            {visibility.edit && (
              <Button
                categories="Medium"
                // color="Fade"
                onClick={() => setEditing((prev) => !prev)}
              >
                {editing ? "Cancel" : "Edit"}
              </Button>
            )}
          </div>
        </div>

        <form
          onSubmit={handleSubmit(handleSave)}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* <div className="space-y-3"> */}
          <InputGroup
            label="Category ID"
            name="category_id"
            register={register}
            required={true}
            errors={errors}
            readOnlyMode={true}
          />

          <InputGroup
            label="Category Name"
            name="category_name"
            register={register}
            required={true}
            maxLength={100}
            errors={errors}
            oldValue={category.data.old_category_name}
            readOnlyMode={true}
          />

          <InputGroup
            label="Category Level"
            name="category_level"
            register={register}
            // required={true}
            type="number"
            errors={errors}
            readOnlyMode={true}
          />

          <DropdownGroup
            label="Category Type"
            name="category_type"
            options={categoryTypeOptions}
            register={register}
            // required={true}
            errors={errors}
            watch={watch}
            readOnly={!editing}
          />

          <InputGroup
            label="Parent Category ID"
            name="parent_category_id"
            register={register}
            // oldValue={category.data.old_parent_category_id}
            errors={errors}
            readOnlyMode={true}
          />

          <DropdownGroup
            label="Default Mapping"
            name="default_mapping"
            options={defaultMappingOptions}
            register={register}
            errors={errors}
            oldValue={category.data.old_default_mapping}
            watch={watch}
            readOnly={!editing}
          />

          <DropdownGroup
            label="Cashflow Nature"
            name="cashflow_nature"
            options={cashflowNatureOptions}
            register={register}
            errors={errors}
            oldValue={category.data.old_cashflow_nature}
            watch={watch}
            readOnly={!editing}
          />

          <DropdownGroup
            label="Usage Flag"
            name="usage_flag"
            options={usageFlagOptions}
            register={register}
            errors={errors}
            oldValue={category.data.old_usage_flag}
            watch={watch}
            readOnly={!editing}
          />

          <InputGroup
            label="Description"
            name="description"
            register={register}
            maxLength={500}
            errors={errors}
            oldValue={category.data.old_description}
            readOnlyMode={!editing}
          />
          {/* </div> */}

          {/* <div className="space-y-3"> */}
          <DropdownGroup
            label="Status"
            name="status"
            options={statusOptions}
            register={register}
            // required={true}
            errors={errors}
            oldValue={category.data.old_status}
            watch={watch}
            readOnly={!editing}
          />

          <DropdownGroup
            label="Processing Status"
            name="processing_status"
            options={processingStatusOptions}
            register={register}
            errors={errors}
            watch={watch}
            readOnly={true}
          />

          <InputGroup
            label="Requested By"
            name="requested_by"
            register={register}
            errors={errors}
            readOnlyMode={true}
          />

          <InputGroup
            label="Requested At"
            name="requested_at"
            register={register}
            type="datetime-local"
            errors={errors}
            readOnlyMode={true}
          />

          <InputGroup
            label="Checker By"
            name="checker_by"
            register={register}
            errors={errors}
            readOnlyMode={true}
          />

          <InputGroup
            label="Checker At"
            name="checker_at"
            register={register}
            type="date"
            errors={errors}
            readOnlyMode={true}
          />

          <InputGroup
            label="Checker Comment"
            name="checker_comment"
            register={register}
            maxLength={500}
            errors={errors}
            readOnlyMode={true}
          />

          <InputGroup
            label="Reason"
            name="reason"
            register={register}
            maxLength={200}
            errors={errors}
            readOnlyMode={true}
          />

          {category.data.created_by && (
            <InputGroup
              label="Created By"
              name="created_by"
              register={register}
              readOnlyMode={true}
            />
          )}
          {category.data.created_at && (
            <InputGroup
              label="Created At"
              name="created_at"
              register={register}
              readOnlyMode={true}
            />
          )}
          {category.data.edited_by && (
            <InputGroup
              label="Edited By"
              name="edited_by"
              register={register}
              readOnlyMode={true}
            />
          )}
          {category.data.edited_at && (
            <InputGroup
              label="Edited At"
              name="edited_at"
              register={register}
              readOnlyMode={true}
            />
          )}
          {category.data.deleted_by && (
            <InputGroup
              label="Deleted By"
              name="deleted_by"
              register={register}
              readOnlyMode={true}
            />
          )}
          {category.data.deleted_at && (
            <InputGroup
              label="Deleted At"
              name="deleted_at"
              register={register}
              readOnlyMode={true}
            />
          )}
          {/* </div> */}

          {editing && (
            <div className="col-span-2 flex justify-end mt-4">
              <Button categories="Large" color="Green" type="submit">
                Save
              </Button>
            </div>
          )}
        </form>
      </div>
    );
  };

  const handleApprove = async (category_id: string, category_name: string) => {
    try {
      const confirmResult = await confirm(
        `Are you sure you want to approve ${category_name}`,
        {
          input: true,
          inputLabel: "Approve Comments (optional)",
          inputPlaceholder: "Enter comments...",
        }
      );
      if (!confirmResult.confirmed) return;

      const payload = {
        category_ids: [category_id],
        comments: confirmResult.inputValue || "",
      };
      const response = await nos.post<APIResponse>(
        `${apiBaseUrl}/master/cashflow-category/bulk-approve`,
        payload
      );
      if (response.data.updated && response.data.updated[0].success) {
        throw new Error(`Approval failed. Status: ${response.status}`);
      }
      notify(`${category_name} approved successfully!`, "success");
    } catch (error) {
      notify("Failed to approve entity. Please try again.", "error");
    }
  };

  const handleReject = async (category_id: string, category_name: string) => {
    try {
      const confirmResult = await confirm(
        `Are you sure you want to approve ${category_name}`,
        {
          input: true,
          inputLabel: "Reject Comments (optional)",
          inputPlaceholder: "Enter comments...",
        }
      );
      if (!confirmResult.confirmed) return;

      const payload = {
        category_ids: [category_id],
        comments: confirmResult.inputValue || "",
      };
      const response = await nos.post<APIResponse>(
        `${apiBaseUrl}/master/cashflow-category/bulk-reject`,
        payload
      );
      if (response.data.updated && response.data.updated[0].success) {
        throw new Error(`Rejection failed. Status: ${response.status}`);
      }
      notify(`${category_name} rejected successfully!`, "success");
    } catch (error) {
      notify("Failed to reject entity. Please try again.", "error");
    }
  };

  const handleDelete = async (category_id: string, category_name: string) => {
    try {
      const confirmResult = await confirm(
        `Are you sure you want to delete ${category_name}`,
        {
          input: true,
          inputLabel: "Delete Comments (optional)",
          inputPlaceholder: "Enter comments...",
        }
      );
      if (!confirmResult.confirmed) return;

      const payload = {
        ids: [category_id],
        reason: confirmResult.inputValue || "",
      };
      const response = await nos.post<APIResponse>(
        `${apiBaseUrl}/master/cashflow-category/delete`,
        payload
      );
      if (response.data.updated && response.data.updated[0].success) {
        throw new Error(`Deletion failed. Status: ${response.status}`);
      }
      notify(`${category_name} deleted successfully!`, "success");
    } catch (error) {
      notify("Failed to delete entity. Please try again.", "error");
    }
  };

  function updateNodeDataInTree(
    tree: TreeNodeType | TreeNodeType[],
    nodeId: string,
    updatedData: TreeNodeType["data"]
  ): TreeNodeType | TreeNodeType[] {
    if (Array.isArray(tree)) {
      return tree.map((node: TreeNodeType): TreeNodeType => {
        if (node.data.category_id === nodeId) {
          return { ...node, data: { ...updatedData } };
        } else if (node.children) {
          return {
            ...node,
            children: updateNodeDataInTree(
              node.children,
              nodeId,
              updatedData
            ) as TreeNodeType[],
          };
        }
        return node;
      });
    } else {
      if (tree.data.category_id === nodeId) {
        return { ...tree, data: { ...updatedData } };
      } else if (tree.children) {
        return {
          ...tree,
          children: updateNodeDataInTree(
            tree.children,
            nodeId,
            updatedData
          ) as TreeNodeType[],
        };
      }
      return tree;
    }
  }

  return (
    <>
      {loading ? (
        <div className="flex justify-center items-center h-[60vh]">
          {/* <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-opacity-75"></div> */}
          <LoadingSpinner />
        </div>
      ) : (
        <div className="min-h-screen">
          <div className="w-full">
            <div className="flex space-x-4 w-full">
              {/* Left panel (tree view) */}
              <div className="bg-secondary-color-lt text-secondary-text-dark w-full rounded-lg border border-border p-6">
                <div className="flex justify-between items-center mt-6 border-b border-border mb-8 pb-2">
                  <h2 className="text-[24px] font-semibold">Hierarchy Tree</h2>
                  <div className="flex items-center gap-2 justify-end">
                    {selectedNode &&
                      visibility.approve &&
                      selectedNode.data.processing_status !== "Approved" && (
                        <Button
                          categories="Medium"
                          onClick={() => {
                            updateApprovalStatus(selectedNode.id, "APPROVED");
                            handleApprove(
                              selectedNode.data.category_id,
                              selectedNode.data.category_name
                            );
                          }}
                          // className="bg-primary hover:bg-primary-hover text-center text-white rounded px-4 py-2 font-bold transition min-w-[4rem]"
                        >
                          Approve
                        </Button>
                      )}
                    {selectedNode &&
                      visibility.reject &&
                      selectedNode.data.processing_status !== "Approved" && (
                        <Button
                          categories="Medium"
                          onClick={() => {
                            updateApprovalStatus(selectedNode.id, "REJECTED");
                            handleReject(
                              selectedNode.data.category_id,
                              selectedNode.data.category_name
                            );
                          }}
                          // className="bg-primary hover:bg-primary-hover text-center text-white rounded px-4 py-2 font-bold transition min-w-[4rem]"
                        >
                          Reject
                        </Button>
                      )}
                    <div className="min-w-[150px]">
                      <Button
                        categories="Medium"
                        color="Fade"
                        onClick={toggleAllNodes}
                      >
                        {isAllExpanded ? "Collapse All" : "Expand All"}
                      </Button>
                    </div>
                  </div>
                </div>
                <div>
                  {Array.isArray(treeData) ? (
                    treeData.map((node) => (
                      <TreeNode<TreeNodeType["data"]>
                        key={node.id}
                        node={node}
                        selectedNode={selectedNode}
                        setSelectedNode={setSelectedNode}
                        treeData={treeData}
                        expandedNodes={expandedNodes}
                        toggleNode={toggleNode}
                      />
                    ))
                  ) : treeData ? (
                    <TreeNode<TreeNodeType["data"]>
                      node={treeData}
                      selectedNode={selectedNode}
                      setSelectedNode={setSelectedNode}
                      treeData={treeData}
                      expandedNodes={expandedNodes}
                      toggleNode={toggleNode}
                    />
                  ) : (
                    <div className="text-center py-8 text-primary">
                      No hierarchy available
                    </div>
                  )}
                </div>
              </div>

              {/* Right panel (details and actions) */}
              <div className="flex flex-col bg-secondary-color-lt w-full space-y-10 rounded-lg border border-border p-6">
                {selectedNode ? (
                  <>
                    <CategoryDetails
                      category={{ data: selectedNode.data }}
                      onUpdateCategory={(updatedData) => {
                        setTreeData((prevTree) => {
                          if (!prevTree) return prevTree;
                          return updateNodeDataInTree(
                            prevTree,
                            selectedNode.id,
                            updatedData
                          );
                        });
                      }}
                    />
                  </>
                ) : (
                  <div className="text-center py-8 text-primary">
                    Select a node to view details
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AllCostProfitCenters;
