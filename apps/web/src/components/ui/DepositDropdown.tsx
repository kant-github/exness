import { Dispatch, SetStateAction } from "react";
import OpacityBackground from "./OpacityBackground";
import UtilityCard from "./UtilityCard";

interface DepositDropdownProps {
    setOpen: Dispatch<SetStateAction<boolean>>
}

export default function DepositDropdown({ setOpen }: DepositDropdownProps) {
    return (
        <OpacityBackground onBackgroundClick={() => setOpen(false)}>
            <UtilityCard className="bg-neutral-800 px-8 py-4 rounded-md border-[1px] border-neutral-700 shadow-xl max-w-[28rem]">
                <div className="text-neutral-300 text-xl font-semibold tracking-wider">Deposit demo money</div>
                <p className="text-neutral-400 text-[13px] font-light mt-2">
                    The DepositDropdown component provides users with a modal interface for depositing demo money into their account.
                    It opens as an overlay with a semi-transparent background to keep focus on the card.
                </p>
                <button type="button" className="bg-[#ffde02] px-6 py-2 mt-4 rounded-md text-neutral-950 font-normal w-full cursor-pointer">
                    Top up demo account
                </button>
            </UtilityCard>
        </OpacityBackground>
    )
}