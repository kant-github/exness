import Applogo from "../ui/Applogo";

export default function Navbar() {
    return (
        <div className="w-full border-b-[1px] dark:border-neutral-700 border-neutral-300">
            <div className="flex items-center justify-between w-full px-4 py-2">
                <Applogo />
            </div>
        </div>
    )
}