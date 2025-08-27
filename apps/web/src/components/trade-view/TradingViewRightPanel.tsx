import DummyCandleChart from "./TradingChart";

export default function TradingViewRightPanel() {
    
    return (
        <div className="bg-[#3f464a] grid grid-rows-[60%_40%] gap-1">
            <div className="bg-[#141c23] rounded-tl-md rounded-bl-md">
                <DummyCandleChart />
            </div>
            <div className="bg-[#141c23] rounded-tl-md "></div>
        </div>
    )
}