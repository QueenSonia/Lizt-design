import svgPaths from '../imports/svg-29y976erpk'

interface HeaderProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
}

function SearchIcon() {
  return (
    <div className="relative shrink-0 size-6">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 24 24"
      >
        <g>
          <path
            d={svgPaths.p19568f00}
            stroke="#ABB7C2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <path
            d="M21 21L16.7 16.7"
            stroke="#ABB7C2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </g>
      </svg>
    </div>
  )
}

function SlidersIcon() {
  return (
    <div className="relative shrink-0 size-6">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 24 24"
      >
        <g>
          <path
            d="M21 4H14"
            stroke="white"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <path
            d="M10 4H3"
            stroke="white"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <path
            d="M21 12H12"
            stroke="white"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <path
            d="M8 12H3"
            stroke="white"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <path
            d="M21 20H16"
            stroke="white"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <path
            d="M12 20H3"
            stroke="white"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <path
            d="M14 2V6"
            stroke="white"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <path
            d="M8 10V14"
            stroke="white"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <path
            d="M16 18V22"
            stroke="white"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </g>
      </svg>
    </div>
  )
}

function PlusIcon() {
  return (
    <div className="relative shrink-0 size-6">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 24 24"
      >
        <g>
          <path d={svgPaths.p7fcb800} fill="white" />
        </g>
      </svg>
    </div>
  )
}

export function Header({ searchQuery, setSearchQuery }: HeaderProps) {
  return (
    <div className="absolute bg-white h-[131px] left-[-1px] right-px rounded-bl-[35px] rounded-br-[35px] shadow-[0px_4px_24px_0px_rgba(168,168,168,0.25)] top-1.5">
      {/* Search Bar */}
      <div 
        className="absolute bg-white box-border flex flex-row gap-1.5 h-[60px] items-center justify-start left-1/2 overflow-clip px-2 py-0 rounded-[32px] shadow-[0px_4px_12px_0px_rgba(13,10,44,0.06)] translate-x-[-50%] translate-y-[-50%] w-[450px]"
        style={{ top: "calc(50% - 0.5px)" }}
      >
        {/* Search Icon */}
        <div className="box-border flex flex-row gap-2.5 items-center justify-start p-[10px]">
          <SearchIcon />
        </div>
        
        {/* Search Input */}
        <div className="basis-0 box-border flex flex-row grow items-center justify-start min-h-px min-w-px p-0">
          <input
            type="text"
            placeholder="Search ... "
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-[#abb7c2] text-[18px] font-['Poppins'] placeholder-[#abb7c2]"
          />
        </div>
        
        {/* Filter Button */}
        <div className="box-border flex flex-row gap-2.5 items-center justify-start p-[10px] rounded-[5px] relative">
          <div
            className="absolute bg-gradient-to-b from-[#785dba] left-1/2 size-[60px] to-[#b091f9] top-1/2 translate-x-[-50%] translate-y-[-50%]"
          />
          <SlidersIcon />
        </div>
      </div>
      
      {/* New Button */}
      <div
        className="absolute box-border flex flex-row gap-3.5 h-12 items-center justify-center right-[41px] px-[9px] py-2.5 rounded-xl top-[41px]"
        style={{
          backgroundImage: "linear-gradient(54.1087deg, rgb(121, 66, 251) 3.4659%, rgb(176, 145, 249) 103.83%)",
        }}
      >
        <div className="text-white text-[14px] font-['Plus_Jakarta_Sans'] font-normal">
          New
        </div>
        <PlusIcon />
      </div>
      
      {/* Logo */}
      <div className="absolute bg-white box-border flex flex-row gap-[9.92px] items-center justify-center left-[33px] p-[9.92047px] top-8">
        <div className="text-[#673ab7] text-[35.7137px] font-['Comfortaa'] font-semibold tracking-[-3.78782px]">
          panda
        </div>
      </div>
    </div>
  )
}