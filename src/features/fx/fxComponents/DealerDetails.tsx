import React from "react";
import SectionCard from "../../../components/ui/SectionCard";

type DealerState = {
  internalDealer: string;
  counterpartyDealer: string;
};

interface DealerDetailsProps {
  dealerInfo: DealerState;
  isThere?: boolean; // Optional prop to control if the component is in a "view" mode
  setDealerInfo: React.Dispatch<React.SetStateAction<DealerState>>;
}

const DealerDetails: React.FC<DealerDetailsProps> = ({ dealerInfo, setDealerInfo , isThere=false}) => {
  return (
    <SectionCard title="Dealer Details">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="text-sm text-secondary-text mb-1">
            Internal Dealer
          </label>
          <input
            type="text"
            className="h-[37px] border p-2 text-secondary-text-dark rounded border-border"
            value={dealerInfo.internalDealer}
            onChange={(e) =>
              setDealerInfo((prev) => ({
                ...prev,
                internalDealer: e.target.value,
              }))
            }
            disabled={isThere}
            placeholder="Enter internal dealer"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-secondary-text mb-1">
            Counterparty Dealer
          </label>
          <input
            type="text"
            className="h-[37px] border p-2 text-secondary-text-dark rounded border-border"
            value={dealerInfo.counterpartyDealer}
            onChange={(e) =>
              setDealerInfo((prev) => ({
                ...prev,
                counterpartyDealer: e.target.value,
              }))
            }
            disabled={isThere}
            placeholder="Enter counterparty dealer"
          />
        </div>
      </div>
    </SectionCard>
  );
};

export default DealerDetails;
