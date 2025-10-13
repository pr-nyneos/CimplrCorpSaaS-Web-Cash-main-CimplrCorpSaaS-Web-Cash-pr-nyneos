import React from "react";
import SectionCard from "../../../components/ui/SectionCard";

type ConfirmationDetails = {
  bankTransactionId: string;
  swiftUniqueId: string;
  bankConfirmationDate: string;
};

interface FxConfirmationDetailProps {
  details: ConfirmationDetails;
  setDetails: React.Dispatch<React.SetStateAction<ConfirmationDetails>>;
  isLoading?: boolean;
}

const FxConfirmationDetail: React.FC<FxConfirmationDetailProps> = ({
  details,
  setDetails,
  isLoading = false,
}) => {
  return (
    <SectionCard title="Fx Confirmation Details">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col">
          <label className="text-sm text-secondary-text mb-1">Bank Transaction ID</label>
          <input
            type="text"
            value={details.bankTransactionId}
            onChange={(e) => setDetails(prev => ({ ...prev, bankTransactionId: e.target.value }))}
            placeholder="To be populated from SWIFT"
            className="h-[37px] border border-gray-300 rounded px-2"
            disabled={isLoading}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-secondary-text mb-1">SWIFT Unique ID</label>
          <input
            type="text"
            value={details.swiftUniqueId}
            onChange={(e) => setDetails(prev => ({ ...prev, swiftUniqueId: e.target.value }))}
            placeholder="To be populated from SWIFT"
            className="h-[37px] border border-gray-300 rounded px-2"
            disabled={isLoading}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-secondary-text mb-1">Bank Confirmation Date</label>
          <input
            type="date"
            value={details.bankConfirmationDate}
            onChange={(e) => setDetails(prev => ({ ...prev, bankConfirmationDate: e.target.value }))}
            className="h-[37px] border border-gray-300 rounded px-2"
            disabled={isLoading}
          />
        </div>
      </div>
    </SectionCard>
  );
};

export default FxConfirmationDetail;
