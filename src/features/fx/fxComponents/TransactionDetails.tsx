import React from "react";
import SectionCard from "../../../components/ui/SectionCard";
import CustomSelect from "../../../components/ui/SearchSelect";

interface TransactionDetailsProps {
  systemTransactionId?: string;
  internalReferenceId: string;
  internalRefOptions?: string[]; // For dropdown
  useDropdown?: boolean;
  isThere?: boolean;
  onInternalRefChange: (value: string) => void;
}

const TransactionDetails: React.FC<TransactionDetailsProps> = ({
  systemTransactionId = "",
  internalReferenceId,
  internalRefOptions = [],
  useDropdown = false,
  isThere = false,
  onInternalRefChange,
}) => {
  const customSelectOptions = internalRefOptions.map((id) => ({
    value: id,
    label: id,
  }));

  return (
    <SectionCard title="Transaction Details">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="text-sm text-secondary-text mb-1">
            System Transaction ID
          </label>
          <input
            className="h-[37px] border p-2 bg-secondary-color-lt text-secondary-text-dark rounded border-border"
            type="text"
            placeholder="Auto-generated"
            value={systemTransactionId}
            disabled
          />
        </div>

        <div className="flex flex-col">
          {useDropdown ? (
            <CustomSelect
              label="Internal Reference ID"
              options={customSelectOptions}
              selectedValue={internalReferenceId}
              onChange={onInternalRefChange}
              placeholder="Select Reference ID"
              isDisabled={isThere}
            />
          ) : (
            <>
              <label className="text-sm text-secondary-text mb-1">
                Internal Reference ID
              </label>
              <input
                className="h-[37px] border p-2 bg-white text-secondary-text-dark rounded border-border focus:outline-none"
                type="text"
                placeholder="Internal Reference ID"
                value={internalReferenceId}
                onChange={(e) => onInternalRefChange(e.target.value)}
                disabled={isThere}
              />
            </>
          )}
        </div>
      </div>
    </SectionCard>
  );
};

export default TransactionDetails;
