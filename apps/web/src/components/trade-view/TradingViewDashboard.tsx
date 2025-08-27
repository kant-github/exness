import TradingViewLeftPanel from "./TradingViewLeftPanel"
import TradingViewRightPanel from "./TradingViewRightPanel"

export default function TradingViewDashboard() {
    return (
        <div className="w-full grid grid-cols-[32%_68%] gap-1 flex-1">
            <TradingViewLeftPanel />
            <TradingViewRightPanel />
        </div>
    )
}