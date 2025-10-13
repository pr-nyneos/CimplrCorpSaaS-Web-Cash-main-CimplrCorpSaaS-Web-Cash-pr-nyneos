import React, { useState, useEffect } from "react";
import {
  useReactTable,
  type ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  flexRender,
} from "@tanstack/react-table";
import CustomSelect from "../../../components/ui/SearchSelect";
import Pagination from "../../../components/table/Pagination";
import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { Draggable } from "../../../components/table/Draggable";
import { Droppable } from "../../../components/table/Droppable";
import {
  ChevronDown,
  ChevronUp,
  Split,
  Users,
  FileText,
  X,
} from "lucide-react"; // Add X icon import
import Button from "../../../components/ui/Button";
import nos from "../../../utils/nos";
import SplitDrawer from "./SplitDrawer";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification";
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

// Type Definitions
interface SuggestedAccount {
  id: string;
  name: string;
  currency: string;
  score: number;
  confidence: number;
  reasons: string[];
  warnings: string[];
}

interface ProposedAllocation {
  account_id: string;
  pct: number;
}

interface TransactionLine {
  line_id: string;
  date: string;
  type: "outflow" | "inflow";
  source_ref: string;
  counterparty_or_type: string;
  category: string;
  amount: number;
  currency: string;
  rationale: string[];
  allocated_bank_account?: string;
  allocated_amount?: number;
}

interface TransactionGroup {
  group_id: string;
  group_label: string;
  direction: "outflow" | "inflow" | string;
  currency: string;
  primary_key: string;
  primary_value: string;
  count: number;
  total_amount: number;
  suggested_accounts: SuggestedAccount[];
  proposed_allocation: ProposedAllocation[];
  lines: TransactionLine[];
  group_warnings: string[];
  status: "allocated" | "unallocated" | "partially_allocated" | string;
  allocated_accounts?: {
    account_id: string;
    allocated_amount: number;
  }[];
}

const nonDraggableColumns = [
  "actions",
  "expand",
  "group_id",
  "group_label",
  "direction",
  "count",
  "total_amount",
  "suggested_accounts",
  "proposed_allocation",
  "allocation",
  "confidence",
  "warnings",
];
const nonSortingColumns = [
  "actions",
  "expand",
  "group_id",
  "group_label",
  "direction",
  "count",
  "total_amount",
  "suggested_accounts",
  "proposed_allocation",
  "allocation",
  "confidence",
  "warnings",
];

const FundPlanning: React.FC = () => {
  const [data, setData] = useState<TransactionGroup[]>([]);
  const [selectedRow, setSelectedRow] = useState<TransactionGroup | null>(null);
  const [planningHorizon, setPlanningHorizon] = useState("14");
  const [entity, setEntity] = useState("");
  const [planningCurrency, setPlanningCurrency] = useState("");
  const [bu, setBu] = useState("");
  const [sources, setSources] = useState({
    payables: true,
    receivables: true,
    projections: true,
  });
  const [groupingKey, setGroupingKey] = useState("counterparty");
  const [columnOrder, setColumnOrder] = useState<string[]>([
    "group_label",
    "group_id",
    "count",
    "total_amount",
    "direction",
    "suggested_accounts",
    "proposed_allocation",
    "allocation",
    "confidence",
    "warnings",
    "actions",
    "expand",
  ]);
  const [splitDrawerOpen, setSplitDrawerOpen] = useState(false);
  const [splitDrawerRow, setSplitDrawerRow] = useState<TransactionGroup | null>(
    null
  );
  const [BUEntityOptions, setBUEntityOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [currencyOptions, setCurrencyOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [departmentOptions, setDepartmentOptions] = useState<
    { value: string; label: string }[]
  >([]);

  const planningHorizonOptions = [
    { value: "14", label: "Next 14 days" },
    { value: "30", label: "Next 30 days" },
  ];
  const { notify } = useNotification();

  const rowRefs = React.useRef<Record<string, HTMLTableRowElement | null>>({});

  // Helper function to get selected account
  const getSelectedAccount = (
    group: TransactionGroup
  ): SuggestedAccount | null => {
    if (group.proposed_allocation.length === 0) return null;
    const allocAccountId = group.proposed_allocation[0].account_id;
    return (
      group.suggested_accounts.find((acc) => acc.id === allocAccountId) || null
    );
  };

  // Handle account change from dropdown
  const handleAccountChange = (groupId: string, accountId: string) => {
    setData((prevData) =>
      prevData.map((group) => {
        if (group.group_id === groupId) {
          const selectedAccount = group.suggested_accounts.find(
            (acc) => acc.id === accountId
          );

          if (selectedAccount) {
            const updatedGroup = {
              ...group,
              proposed_allocation: [{ account_id: accountId, pct: 100 }],
              status: "unallocated", // Reset status when account changes
            };

            // Update selected row if this group is selected
            if (selectedRow?.group_id === groupId) {
              setSelectedRow(updatedGroup);
            }

            return updatedGroup;
          }
        }
        return group;
      })
    );
  };

  // Apply Group action
  const handleApplyGroup = (group: TransactionGroup) => {
    const selectedAccount = getSelectedAccount(group);

    if (!selectedAccount) {
      notify("Please select an account first", "warning");
      return;
    }

    // Check confidence level
    if (selectedAccount.confidence < 50) {
      notify(
        `Confidence level (${selectedAccount.confidence}%) is low. Please review before applying.`,
        "warning"
      );
      return;
    }

    // Apply the allocation
    setData((prevData) =>
      prevData.map((g) =>
        g.group_id === group.group_id
          ? {
              ...g,
              status: "allocated",
              allocated_accounts: [
                {
                  account_id: selectedAccount.id,
                  allocated_amount: g.total_amount,
                },
              ],
            }
          : g
      )
    );

    notify("Group allocation applied successfully!", "success");
  };

  const handleDeallocateGroup = (groupId: string) => {
    setData((prevData) =>
      prevData.map((group) =>
        group.group_id === groupId
          ? { ...group, status: "unallocated", allocated_accounts: undefined }
          : group
      )
    );
    // If the selected row is the one being deallocated, remove selection
    if (selectedRow?.group_id === groupId) {
      setSelectedRow(null);
    }
    notify("Group deallocated", "info");
  };

  // Apply All Suggested
  const handleApplyAllSuggested = () => {
    let appliedCount = 0;
    let skippedCount = 0;

    const updatedData = data.map((group) => {
      const selectedAccount = getSelectedAccount(group);

      if (!selectedAccount) {
        skippedCount++;
        return group;
      }

      // Skip if confidence is low or there are warnings
      if (selectedAccount.confidence < 50) {
        skippedCount++;
        notify(
          `Skipped group ${group.group_id}: Confidence level (${selectedAccount.confidence}%) is low`,
          "warning"
        );
        return group;
      }

      appliedCount++;
      return {
        ...group,
        status: "allocated",
        allocated_accounts: [
          {
            account_id: selectedAccount.id,
            allocated_amount: group.total_amount,
          },
        ],
      };
    });

    setData(updatedData);

    if (appliedCount > 0) {
      notify(`Applied allocation to ${appliedCount} group(s)`, "success");
    }
    if (skippedCount > 0) {
      notify(
        `Skipped ${skippedCount} group(s) due to low confidence or warnings`,
        "info"
      );
    }
  };

  // Handle split save from drawer
  const handleSplitSave = (
    splits: { account: string; amount: number }[],
    groupId: string
  ) => {
    const group = data.find((g) => g.group_id === groupId);
    if (!group) return;

    const totalAllocated = splits.reduce((sum, split) => sum + split.amount, 0);

    if (Math.abs(totalAllocated - group.total_amount) > 0.01) {
      notify("Total allocated amount must equal group total amount", "error");
      return;
    }

    const proposedAllocation = splits.map((split) => ({
      account_id: split.account,
      pct: Math.round((split.amount / group.total_amount) * 100),
    }));

    const allocatedAccounts = splits.map((split) => ({
      account_id: split.account,
      allocated_amount: split.amount,
    }));

    const status = splits.length > 0 ? "allocated" : "unallocated";

    setData((prevData) =>
      prevData.map((g) =>
        g.group_id === groupId
          ? {
              ...g,
              proposed_allocation: proposedAllocation,
              allocated_accounts: allocatedAccounts,
              status: status,
              lines: g.lines.map((line) => ({
                ...line,
                allocated_bank_account: splits[0]?.account,
                allocated_amount:
                  line.amount * (splits[0]?.amount / group.total_amount || 0),
              })),
            }
          : g
      )
    );

    notify("Split allocation applied successfully!", "success");
    setSplitDrawerOpen(false);
    setSplitDrawerRow(null);
  };

  // Publish Plan
  const handlePublishPlan = async () => {
    const allocatedGroups = data.filter(
      (group) => group.status === "allocated"
    );

    if (allocatedGroups.length === 0) {
      notify("No allocated groups to publish", "warning");
      return;
    }

    const payload = {
      plan_id: `plan-${Date.now()}`,
      entity_name: entity,
      horizon: Number(planningHorizon),
      groups: allocatedGroups.map((group) => ({
        group_id: group.group_id,
        status: group.status,
        total_amount: group.total_amount,
        allocated_accounts: group.allocated_accounts || [],
        lines: group.lines.map((line) => ({
          line_id: line.line_id,
          amount: line.amount,
          allocated_bank_account:
            line.allocated_bank_account ||
            group.allocated_accounts?.[0]?.account_id ||
            "",
          allocated_amount: line.allocated_amount || line.amount,
        })),
      })),
    };

    try {
      // Send to your API
      const response = await nos.post<any>(
        `${apiBaseUrl}/cash/fund-planning/create`,
        payload
      );

      if (response.data.success) {
        notify("Plan published successfully!", "success");
      } else {
        notify("Failed to publish plan", "error");
      }
    } catch (error) {
      notify("Error publishing plan", "error");
      console.error("Publish error:", error);
    }
  };

  const columns = React.useMemo<ColumnDef<TransactionGroup>[]>(
    () => [
      {
        accessorKey: "group_label",
        header: "Group",
        cell: ({ row }) => {
          const group = row.original;
          const lines = group.group_label.split(" x ");
          return (
            <div
              className="cursor-pointer hover:bg-blue-50 p-1 rounded"
              onClick={() => setSelectedRow(group)}
            >
              {lines.map((line, idx) => (
                <div key={idx}>{line.trim()}</div>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: "count",
        header: "Count",
        cell: ({ getValue }) => <span>{getValue() as number}</span>,
      },
      {
        accessorKey: "total_amount",
        header: "Total Amount",
        cell: ({ row }) => {
          const group = row.original;
          return (
            <span>
              {group.total_amount.toLocaleString("en-IN")} {group.currency}
            </span>
          );
        },
      },
      {
        id: "suggested_accounts",
        header: "Suggested Account",
        cell: ({ row }) => {
          const group = row.original;
          const selectedAccount = getSelectedAccount(group);

          return (
            <select
              value={selectedAccount?.id || ""}
              onChange={(e) =>
                handleAccountChange(group.group_id, e.target.value)
              }
              className="border border-gray-300 rounded px-3 py-2 w-full"
              onClick={() => setSelectedRow(group)}
            >
              {/* <option value="">Select account...</option> */}
              {group.suggested_accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.currency})
                </option>
              ))}
            </select>
          );
        },
      },
      {
        id: "allocation",
        header: "Allocation",
        cell: ({ row }) => {
          const group = row.original;
          const selectedAccount = getSelectedAccount(group);

          if (!selectedAccount) return <span>—</span>;

          return (
            <div className="text-sm">
              <div
                className={`font-semibold ${
                  group.status === "allocated"
                    ? "text-green-600"
                    : group.status === "partially_allocated"
                    ? "text-yellow-600"
                    : "text-gray-600"
                }`}
              >
                {group.status === "allocated"
                  ? "✓ Allocated"
                  : group.status === "partially_allocated"
                  ? "Partial"
                  : "Not Allocated"}
              </div>
              {group.proposed_allocation.map((alloc, idx) => {
                const account = group.suggested_accounts.find(
                  (a) => a.id === alloc.account_id
                );
                return (
                  <div key={idx}>
                    {alloc.pct}% — {account?.name || "Unknown"}
                  </div>
                );
              })}
            </div>
          );
        },
      },
      {
        id: "confidence",
        header: "Confidence",
        cell: ({ row }) => {
          const group = row.original;
          const selectedAccount = getSelectedAccount(group);

          return (
            <span
              className={`font-semibold text-center ${
                (selectedAccount?.confidence || 0) >= 80
                  ? "text-green-700"
                  : (selectedAccount?.confidence || 0) >= 50
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {selectedAccount?.confidence || "—"}
            </span>
          );
        },
      },
      {
        id: "warnings",
        header: "Warnings",
        cell: ({ row }) => {
          const group = row.original;
          const selectedAccount = getSelectedAccount(group);
          const warnings = [
            ...(group.group_warnings || []),
            ...(selectedAccount?.warnings || []),
          ];

          return (
            <span className={warnings.length > 0 ? "text-red-600" : ""}>
              {warnings.length > 0 ? `${warnings.length} warning(s)` : "—"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const group = row.original;
          const selectedAccount = getSelectedAccount(group);

          return (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => handleOpenSplitDrawer(group)}
                className="flex items-center gap-1 hover:bg-gray-100 p-1 rounded"
                title="Split"
              >
                <Split className="w-4 h-4 text-red-600" />
              </button>
              <button
                onClick={() => handleApplyGroup(group)}
                className="flex items-center gap-1 hover:bg-gray-100 p-1 rounded"
                title="Apply Group"
                disabled={!selectedAccount}
              >
                <Users
                  className={`w-4 h-4 ${
                    selectedAccount ? "text-blue-600" : "text-gray-400"
                  }`}
                />
              </button>
              <button
                onClick={() => handleDeallocateGroup(group.group_id)}
                className="flex items-center gap-1 hover:bg-gray-100 p-1 rounded"
                title="Deallocate"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          );
        },
      },
      {
        id: "expand",
        header: ({ table }) => (
          <button
            type="button"
            className="p-2 flex items-center justify-start"
            onClick={() => table.toggleAllRowsExpanded()}
          >
            {table.getIsAllRowsExpanded() ? (
              <ChevronUp className="w-4 h-4 text-blue-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-blue-600" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <button
            onClick={() => row.toggleExpanded()}
            className="p-2 hover:bg-blue-50 text-blue-600 rounded-md transition-colors"
          >
            {row.getIsExpanded() ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        ),
      },
    ],
    [selectedRow]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = columnOrder.indexOf(active.id as string);
      const newIndex = columnOrder.indexOf(over?.id as string);
      const newOrder = [...columnOrder];
      newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, active.id as string);
      setColumnOrder(newOrder);
    }
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnOrderChange: setColumnOrder,
    state: {
      columnOrder,
    },
  });

  const selectedAccount = selectedRow ? getSelectedAccount(selectedRow) : null;

  const fetchData = async () => {
    try {
      const response = await nos.post<any>(`${apiBaseUrl}/cash/fund-planning`, {
        horizon: Number(planningHorizon),
        entity: entity || "",
        curr: planningCurrency || "",
        pay: sources.payables,
        rec: sources.receivables,
        proj: sources.projections,
        counterparty: groupingKey === "counterparty",
        type: groupingKey === "type",
        costprofit_center: bu || "",
      });
      const result = response.data;
      if (result.success) {
        // Add status to the fetched data
        const dataWithStatus = result.rows.map((group: TransactionGroup) => ({
          ...group,
          status: "unallocated",
        }));
        setData(dataWithStatus);
      } else {
        setData([]);
      }
    } catch (err) {
      setData([]);
    }
  };

  const handleOpenSplitDrawer = (row: TransactionGroup) => {
    setSplitDrawerRow(row);
    setSplitDrawerOpen(true);
  };

  const handleCloseSplitDrawer = () => {
    setSplitDrawerOpen(false);
    setSplitDrawerRow(null);
  };

  // Clear all allocations
  const handleClearAll = () => {
    setData((prevData) =>
      prevData.map((group) => ({
        ...group,
        status: "unallocated",
        allocated_accounts: undefined,
      }))
    );
    notify("All allocations cleared", "info");
  };

  useEffect(() => {
    nos
      .post<{
        results: {
          entity_id: string;
          entity_name: string;
          entity_short_name: string;
        }[];
        success: boolean;
      }>(`${apiBaseUrl}/master/entitycash/all-names`)
      .then((response) => {
        if (response.data.success && response.data.results) {
          setBUEntityOptions(
            response.data.results.map((item) => ({
              value: item.entity_name,
              label: item.entity_name,
            }))
          );
        } else {
          setBUEntityOptions([]);
        }
      })
      .catch(() => setBUEntityOptions([]));

    nos
      .post<{
        results: { currency_code: string; decimal_place: number }[];
        success: boolean;
      }>(`${apiBaseUrl}/master/currency/active-approved`)
      .then((response) => {
        if (response.data.success && response.data.results) {
          setCurrencyOptions(
            response.data.results.map((c) => ({
              value: c.currency_code,
              label: c.currency_code,
            }))
          );
        }
      })
      .catch(() => {
        setCurrencyOptions([]);
      });

    nos
      .post<{
        rows: { centre_name: string; centre_code: string }[];
        success: boolean;
      }>(`${apiBaseUrl}/master/costprofit-center/approved-active`)
      .then((response) => {
        if (response.data.success && response.data.rows) {
          setDepartmentOptions(
            response.data.rows.map((item) => ({
              value: item.centre_code,
              label: item.centre_name,
            }))
          );
        } else {
          setDepartmentOptions([]);
        }
      })
      .catch(() => {
        setDepartmentOptions([]);
      });
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg border border-gray-300 p-6 mb-6">
        <span className="font-semibold text-lg mb-4 pb-4 block">
          Planning Context
        </span>

        <div className="grid grid-cols-4 gap-4 items-end mb-6">
          <CustomSelect
            label="Planning Horizon"
            options={planningHorizonOptions}
            selectedValue={planningHorizon}
            onChange={setPlanningHorizon}
            placeholder="Select horizon"
          />
          <CustomSelect
            label="Entity"
            options={BUEntityOptions}
            selectedValue={entity}
            onChange={setEntity}
            placeholder="Select entity"
          />
          <CustomSelect
            label="Planning Currency"
            options={currencyOptions}
            selectedValue={planningCurrency}
            onChange={setPlanningCurrency}
            placeholder="Select currency"
          />
          <CustomSelect
            label="BU / Cost Centre (optional)"
            options={departmentOptions}
            selectedValue={bu}
            onChange={setBu}
            placeholder="Select BU"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white flex flex-col">
            <label className="block text-sm font-semibold mb-4">
              Include Sources
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-3 text-base">
                <input
                  type="checkbox"
                  checked={sources.payables}
                  onChange={(e) =>
                    setSources((s) => ({ ...s, payables: e.target.checked }))
                  }
                  className="w-4 h-4"
                />
                Payables
              </label>
              <label className="flex items-center gap-3 text-base">
                <input
                  type="checkbox"
                  checked={sources.receivables}
                  onChange={(e) =>
                    setSources((s) => ({ ...s, receivables: e.target.checked }))
                  }
                  className="w-4 h-4"
                />
                Receivables
              </label>
              <label className="flex items-center gap-3 text-base">
                <input
                  type="checkbox"
                  checked={sources.projections}
                  onChange={(e) =>
                    setSources((s) => ({ ...s, projections: e.target.checked }))
                  }
                  className="w-4 h-4"
                />
                Projections
              </label>
            </div>
          </div>
          <div className="bg-white rounded-lg flex flex-col h-full">
            <div className="mb-2">
              <label className="block text-sm font-semibold mb-4">
                Primary Grouping Key
              </label>
              <div className="flex gap-8 mt-2">
                <label className="flex items-center gap-2 text-base">
                  <input
                    type="radio"
                    name="groupingKey"
                    value="counterparty"
                    checked={groupingKey === "counterparty"}
                    onChange={() => setGroupingKey("counterparty")}
                    className="w-4 h-4"
                  />
                  Counterparty
                </label>
                <label className="flex items-center gap-2 text-base">
                  <input
                    type="radio"
                    name="groupingKey"
                    value="type"
                    checked={groupingKey === "type"}
                    onChange={() => setGroupingKey("type")}
                    className="w-4 h-4"
                  />
                  Type
                </label>
                <div className="justify-end ml-auto">
                  <Button color="Green" onClick={fetchData}>
                    Load Due Items
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 items-center justify-between mb-2">
        <span className="font-semibold text-lg">Bulk Groups</span>
        <span></span>
        <span></span>
        <div className="flex gap-2">
          <Button
            color="Green"
            categories="Medium"
            onClick={handleApplyAllSuggested}
          >
            Apply All Suggested
          </Button>
          {/* <Button color="Fade" categories="Medium">
            Apply by Counterparty
          </Button>
          <Button color="Fade" categories="Medium">
            Apply by Currency
          </Button> */}
          <Button color="Fade" categories="Medium" onClick={handleClearAll}>
            Clear All
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mt-6">
        <div className="flex-1 bg-white rounded-lg border border-gray-300 overflow-hidden mb-4">
          <div className="flex-1 bg-white overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <DndContext
                onDragEnd={handleDragEnd}
                modifiers={[restrictToFirstScrollableAncestor]}
              >
                <table className="min-w-full table-auto">
                  <thead className="bg-secondary-color rounded-xl">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          const isDraggable = !nonDraggableColumns.includes(
                            header.column.id
                          );
                          const canSort = !nonSortingColumns.includes(
                            header.column.id
                          );
                          const isSorted = header.column.getIsSorted?.() as
                            | false
                            | "asc"
                            | "desc";
                          return (
                            <th
                              key={header.id}
                              className="px-6 py-4 text-left text-sm font-semibold text-header-color uppercase tracking-wider border-b border-border select-none group "
                              style={{ width: header.getSize() }}
                            >
                              <div className="flex items-center gap-1">
                                <span
                                  className={canSort ? "cursor-pointer" : ""}
                                  onClick={
                                    canSort
                                      ? (e) =>
                                          header.column.toggleSorting?.(
                                            undefined,
                                            (e as React.MouseEvent).shiftKey
                                          )
                                      : undefined
                                  }
                                  tabIndex={canSort ? 0 : undefined}
                                  onKeyDown={
                                    canSort
                                      ? (e) => {
                                          if (
                                            (e as React.KeyboardEvent).key ===
                                              "Enter" ||
                                            (e as React.KeyboardEvent).key ===
                                              " "
                                          ) {
                                            header.column.toggleSorting?.(
                                              undefined,
                                              (e as React.KeyboardEvent)
                                                .shiftKey
                                            );
                                          }
                                        }
                                      : undefined
                                  }
                                  role={canSort ? "button" : undefined}
                                  aria-label={
                                    canSort ? "Sort column" : undefined
                                  }
                                >
                                  {isDraggable ? (
                                    <Droppable id={header.column.id}>
                                      <Draggable id={header.column.id}>
                                        <div className="cursor-move rounded p-1 transition duration-150 ease-in-out hover:bg-primary-lg">
                                          {flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                          )}
                                        </div>
                                      </Draggable>
                                    </Droppable>
                                  ) : (
                                    <div className="px-1">
                                      {flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                      )}
                                    </div>
                                  )}
                                  {canSort && (
                                    <span className="ml-1 text-xs">
                                      {isSorted === "asc" ? (
                                        "▲"
                                      ) : isSorted === "desc" ? (
                                        "▼"
                                      ) : (
                                        <span className="opacity-30">▲▼</span>
                                      )}
                                    </span>
                                  )}
                                </span>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y">
                    {table.getRowModel().rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={columns.length}
                          className="px-6 py-12 text-center text-primary"
                        >
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                              <FileText />
                            </div>
                            <p className="text-lg font-medium text-primary">
                              No Data Available
                            </p>
                            <p className="text-sm font-medium text-primary">
                              There are no data to display at the moment.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      table.getRowModel().rows.map((row, idx: number) => (
                        <React.Fragment key={row.id}>
                          <tr
                            className={
                              idx % 2 === 0
                                ? "bg-primary-md"
                                : "bg-secondary-color-lt"
                            }
                          >
                            {row.getVisibleCells().map((cell) => (
                              <td key={cell.id} className="px-4 py-3 text-sm">
                                {typeof cell.column.columnDef.cell ===
                                "function"
                                  ? cell.column.columnDef.cell(
                                      cell.getContext()
                                    )
                                  : null}
                              </td>
                            ))}
                          </tr>
                          {row.getIsExpanded() && (
                            <tr
                              key={`${row.id}-expanded`}
                              ref={(el) => {
                                rowRefs.current[row.id] = el;
                              }}
                            >
                              <td
                                colSpan={table.getVisibleLeafColumns().length}
                                className="px-6 py-4 bg-primary-md"
                              >
                                <div className="bg-secondary-color-lt rounded-lg p-4 shadow-md border border-border">
                                  <h4 className="text-md font-medium text-primary mb-3 pb-2">
                                    Transaction Lines:
                                  </h4>
                                  {row.original.lines?.map((line: any) => (
                                    <div
                                      key={line.line_id}
                                      className="bg-white border border-gray-200 rounded-lg p-4 text-sm mb-4 shadow-sm"
                                    >
                                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                          <label className="font-bold text-secondary-text">
                                            Date
                                          </label>
                                          <span className="block font-medium text-primary-lt">
                                            {line.date}
                                          </span>
                                        </div>
                                        <div>
                                          <label className="font-bold text-secondary-text">
                                            Ref
                                          </label>
                                          <span className="block font-medium text-primary-lt">
                                            {line.source_ref}
                                          </span>
                                        </div>
                                        <div>
                                          <label className="font-bold text-secondary-text">
                                            Category
                                          </label>
                                          <span className="block font-medium text-primary-lt">
                                            {line.category}
                                          </span>
                                        </div>
                                        <div>
                                          <label className="font-bold text-secondary-text">
                                            Amount
                                          </label>
                                          <span className="block font-medium text-primary-lt">
                                            {line.amount?.toLocaleString()}{" "}
                                            {line.currency}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="mt-3">
                                        <label className="font-bold text-secondary-text">
                                          Rationale
                                        </label>
                                        {line.rationale &&
                                        Array.isArray(line.rationale) &&
                                        line.rationale.length > 0 ? (
                                          <span className="block font-medium text-primary-lt">
                                            {line.rationale.map((r, i) =>
                                              typeof r === "string" &&
                                              r.startsWith(
                                                "Bank account allocation is managed at the group level"
                                              ) ? (
                                                r
                                                  .split(", ")
                                                  .map((part, idx) => (
                                                    <React.Fragment key={idx}>
                                                      {part}
                                                      <br />
                                                    </React.Fragment>
                                                  ))
                                              ) : (
                                                <React.Fragment key={i}>
                                                  {r}
                                                  <br />
                                                </React.Fragment>
                                              )
                                            )}
                                          </span>
                                        ) : (
                                          <span className="block font-medium text-primary-lt text-gray-400">
                                            No rationale provided
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </DndContext>
            </div>
          </div>
          <Pagination
            table={table}
            totalItems={data.length}
            startIndex={
              data.length === 0
                ? 0
                : table.getState().pagination.pageIndex *
                    table.getState().pagination.pageSize +
                  1
            }
            endIndex={Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              data.length
            )}
          />
        </div>

        <div className="w-96 bg-white border border-gray-300 rounded-lg p-6 sticky top-[5rem] self-start h-fit max-h-[calc(100vh-6rem)] overflow-y-auto">
          {/* <div className="mb-6">
            <span className="items-center gap-2 font-semibold">
              Data Health Status:
            </span>
            <div className="flex items-center gap-3 mb-1 p-1">
              <Button color="Green" categories="Medium">
                Health Check
              </Button>
              <span className="h-[37px] inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-100 text-green-700 font-bold">
                <svg className="w-3 h-3 fill-green-500" viewBox="0 0 8 8">
                  <circle cx="4" cy="4" r="4" />
                </svg>
                Green
              </span>
            </div>
          </div> */}

          {selectedRow && selectedAccount ? (
            <>
              <div className="mb-4">
                <span className="font-semibold text-gray-800">
                  Why this suggestion?
                </span>
                <ul className="list-disc ml-5 mt-2 text-gray-700 text-sm space-y-1">
                  {selectedAccount.reasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>

              <div className="mb-4">
                <span className="font-semibold text-gray-800">Warnings</span>
                <div className="text-gray-700 text-sm mt-2">
                  {selectedRow.group_warnings.length > 0 && (
                    <div className="mb-2">
                      <strong>Group:</strong>
                      <ul className="list-disc ml-5 mt-1">
                        {selectedRow.group_warnings.map((warning, idx) => (
                          <li key={idx} className="text-red-600">
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedAccount.warnings.length > 0 ? (
                    <div>
                      <strong>Account:</strong>
                      <ul className="list-disc ml-5 mt-1">
                        {selectedAccount.warnings.map((warning, idx) => (
                          <li key={idx} className="text-red-600">
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    !selectedRow.group_warnings.length && (
                      <span className="text-gray-500">No warnings</span>
                    )
                  )}
                </div>
              </div>

              <div className="mb-4">
                <span className="font-semibold text-gray-800">Allocation</span>
                <div className="text-gray-700 text-sm mt-2">
                  {selectedRow.proposed_allocation.map((alloc, idx) => {
                    const account = selectedRow.suggested_accounts.find(
                      (a) => a.id === alloc.account_id
                    );
                    return (
                      <div key={idx}>
                        {alloc.pct}% — {account?.name || "Unknown"}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mb-4">
                <span className="font-semibold text-gray-800">Status</span>
                <div
                  className={`text-sm mt-2 font-semibold ${
                    selectedRow.status === "allocated"
                      ? "text-green-600"
                      : selectedRow.status === "partially_allocated"
                      ? "text-yellow-600"
                      : "text-gray-600"
                  }`}
                >
                  {selectedRow.status === "allocated"
                    ? "✓ Allocated"
                    : selectedRow.status === "partially_allocated"
                    ? "⧖ Partially Allocated"
                    : "— Not Allocated"}
                </div>
              </div>
            </>
          ) : (
            <div className="text-gray-500 text-sm text-center py-8">
              Select a row to see details
            </div>
          )}

          <div className="mt-4 flex items-center gap-2">
            {/* <Button color="Fade">Save Draft</Button> */}
            <Button color="Green" onClick={() => setData([])}>
              Start New Plan
            </Button>

            <Button color="Green" onClick={handlePublishPlan}>
              Publish Plan
            </Button>
          </div>
        </div>
      </div>

      {splitDrawerOpen && splitDrawerRow && (
        <SplitDrawer
          open={splitDrawerOpen}
          onClose={handleCloseSplitDrawer}
          row={splitDrawerRow}
          onSave={(splits) => handleSplitSave(splits, splitDrawerRow.group_id)}
          accountOptions={splitDrawerRow.suggested_accounts.map((acc) => ({
            value: acc.id,
            label: `${acc.name} (${acc.currency})`,
          }))}
          // accountBalances={Object.fromEntries(
          //   splitDrawerRow.suggested_accounts.map((acc) => [acc.id, 0])
          // )}
        />
      )}
    </div>
  );
};

export default FundPlanning;
