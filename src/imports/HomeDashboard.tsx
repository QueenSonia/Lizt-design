import svgPaths from "@/imports/svg-29y976erpk";

function Search() {
  return (
    <div className="relative shrink-0 size-6" data-name="search">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 24 24"
      >
        <g id="search">
          <path
            d={svgPaths.p19568f00}
            id="Vector"
            stroke="var(--stroke-0, #ABB7C2)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <path
            d="M21 21L16.7 16.7"
            id="Vector_2"
            stroke="var(--stroke-0, #ABB7C2)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </g>
      </svg>
    </div>
  );
}

function Icon() {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-2.5 items-center justify-start p-[10px] relative shrink-0"
      data-name="Icon"
    >
      <Search />
    </div>
  );
}

function Item() {
  return (
    <div
      className="basis-0 box-border content-stretch flex flex-row grow items-center justify-start min-h-px min-w-px p-0 relative shrink-0"
      data-name="Item"
    >
      <div className="font-['Poppins:Regular',_sans-serif] leading-[0] not-italic relative shrink-0 text-[#abb7c2] text-[18px] text-left text-nowrap">
        <p className="block leading-[normal] whitespace-pre">{`Search ... `}</p>
      </div>
    </div>
  );
}

function SlidersHorizontal() {
  return (
    <div className="relative shrink-0 size-6" data-name="sliders-horizontal">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 24 24"
      >
        <g id="sliders-horizontal">
          <path
            d="M21 4H14"
            id="Vector"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <path
            d="M10 4H3"
            id="Vector_2"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <path
            d="M21 12H12"
            id="Vector_3"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <path
            d="M8 12H3"
            id="Vector_4"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <path
            d="M21 20H16"
            id="Vector_5"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <path
            d="M12 20H3"
            id="Vector_6"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <path
            d="M14 2V6"
            id="Vector_7"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <path
            d="M8 10V14"
            id="Vector_8"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <path
            d="M16 18V22"
            id="Vector_9"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </g>
      </svg>
    </div>
  );
}

function Icon1() {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-2.5 items-center justify-start p-[10px] relative rounded-[5px] shrink-0"
      data-name="Icon"
    >
      <div
        className="absolute bg-gradient-to-b from-[#785dba] left-1/2 size-[60px] to-[#b091f9] top-1/2 translate-x-[-50%] translate-y-[-50%]"
        data-name="Background"
      />
      <SlidersHorizontal />
    </div>
  );
}

function Sample() {
  return (
    <div
      className="absolute bg-[#ffffff] box-border content-stretch flex flex-row gap-1.5 h-[60px] items-center justify-start left-1/2 overflow-clip px-2 py-0 rounded-[32px] shadow-[0px_4px_12px_0px_rgba(13,10,44,0.06)] translate-x-[-50%] translate-y-[-50%] w-[450px]"
      data-name="Sample"
      style={{ top: "calc(50% - 0.5px)" }}
    >
      <Icon />
      <Item />
      <Icon1 />
    </div>
  );
}

function IcRoundPlus() {
  return (
    <div className="relative shrink-0 size-6" data-name="ic:round-plus">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 24 24"
      >
        <g id="ic:round-plus">
          <path d={svgPaths.p7fcb800} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame1261152811() {
  return (
    <div
      className="absolute box-border content-stretch flex flex-row gap-3.5 h-12 items-center justify-center left-[1258px] px-[9px] py-2.5 rounded-xl top-[41px]"
      style={{
        backgroundImage:
          "linear-gradient(54.1087deg, rgb(121, 66, 251) 3.4659%, rgb(176, 145, 249) 103.83%)",
      }}
    >
      <div className="font-['Plus_Jakarta_Sans:Regular',_sans-serif] font-normal leading-[0] relative shrink-0 text-[#ffffff] text-[14px] text-left text-nowrap">
        <p className="block leading-[normal] whitespace-pre">New</p>
      </div>
      <IcRoundPlus />
    </div>
  );
}

function Frame1321316157() {
  return (
    <div className="absolute bg-[#ffffff] box-border content-stretch flex flex-row gap-[9.92px] items-center justify-center left-[33px] p-[9.92047px] top-8">
      <div className="font-['Comfortaa:SemiBold',_sans-serif] font-semibold leading-[0] relative shrink-0 text-[#673ab7] text-[35.7137px] text-left text-nowrap tracking-[-3.78782px]">
        <p className="adjustLetterSpacing block leading-[normal] whitespace-pre">
          panda
        </p>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div
      className="absolute bg-[#ffffff] h-[131px] left-[-1px] right-px rounded-bl-[35px] rounded-br-[35px] shadow-[0px_4px_24px_0px_rgba(168,168,168,0.25)] top-1.5"
      data-name="Header"
    >
      <Sample />
      <Frame1261152811 />
      <Frame1321316157 />
    </div>
  );
}

function SolarHome2Outline() {
  return (
    <div className="relative shrink-0 size-6" data-name="solar:home-2-outline">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 24 24"
      >
        <g id="solar:home-2-outline">
          <path
            d={svgPaths.p2c180100}
            fill="var(--fill-0, #785DBA)"
            id="Vector"
          />
          <path
            clipRule="evenodd"
            d={svgPaths.p9f5f100}
            fill="var(--fill-0, #785DBA)"
            fillRule="evenodd"
            id="Vector_2"
          />
        </g>
      </svg>
    </div>
  );
}

function Frame1261152787() {
  return (
    <div className="box-border content-stretch flex flex-row gap-[11px] items-start justify-start p-0 relative shrink-0">
      <SolarHome2Outline />
      <div className="font-['Plus_Jakarta_Sans:SemiBold',_sans-serif] font-semibold leading-[0] relative shrink-0 text-[#785dba] text-[16px] text-left text-nowrap tracking-[-0.08px]">
        <p className="adjustLetterSpacing block leading-[1.45] whitespace-pre">
          Overview
        </p>
      </div>
    </div>
  );
}

function Group() {
  return (
    <div
      className="absolute bottom-[16.667%] left-[9.048%] right-[7.619%] top-[16.667%]"
      data-name="Group"
    >
      <div className="absolute bottom-[-3.75%] left-[-3%] right-[-3%] top-[-3.75%]">
        <svg
          className="block size-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 22 18"
        >
          <g id="Group">
            <path
              d={svgPaths.p12bf380}
              id="Vector"
              stroke="var(--stroke-0, #787774)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.2"
            />
            <path
              d="M8.82855 17V11H12.8286V17"
              id="Vector_2"
              stroke="var(--stroke-0, #787774)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.2"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}

function LucideLabHouses() {
  return (
    <div
      className="overflow-clip relative shrink-0 size-6"
      data-name="lucide-lab:houses"
    >
      <Group />
    </div>
  );
}

function Frame1261152788() {
  return (
    <div className="box-border content-stretch flex flex-row gap-[11px] items-center justify-start p-0 relative shrink-0">
      <LucideLabHouses />
      <div className="font-['Plus_Jakarta_Sans:Regular',_sans-serif] font-normal leading-[0] relative shrink-0 text-[#787774] text-[16px] text-left text-nowrap">
        <p className="block leading-[20px] whitespace-pre">Properties</p>
      </div>
    </div>
  );
}

function FluentMdl2CRMServices() {
  return (
    <div
      className="relative shrink-0 size-[23px]"
      data-name="fluent-mdl2:c-r-m-services"
    >
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 23 23"
      >
        <g clipPath="url(#clip0_4_652)" id="fluent-mdl2:c-r-m-services">
          <path
            d={svgPaths.p1c66a800}
            fill="var(--fill-0, #787774)"
            id="Vector"
          />
        </g>
        <defs>
          <clipPath id="clip0_4_652">
            <rect fill="white" height="23" width="23" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Frame1261152791() {
  return (
    <div className="box-border content-stretch flex flex-row gap-[11px] items-center justify-start p-0 relative shrink-0 w-full">
      <FluentMdl2CRMServices />
      <div className="font-['Plus_Jakarta_Sans:Regular',_sans-serif] font-normal leading-[0] relative shrink-0 text-[#787774] text-[16px] text-left w-[137px]">
        <p className="block leading-[20px]">Service Requests</p>
      </div>
    </div>
  );
}

function Group1() {
  return (
    <div
      className="absolute bottom-[8.333%] left-[16.667%] right-[16.667%] top-[8.333%]"
      data-name="Group"
    >
      <div className="absolute bottom-[-3.75%] left-[-4.688%] right-[-4.689%] top-[-3.752%]">
        <svg
          className="block size-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 18 22"
        >
          <g id="Group">
            <path
              d={svgPaths.p20e2b80}
              id="Vector"
              stroke="var(--stroke-0, #787774)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
            <path
              d={svgPaths.p11ac6f00}
              id="Vector_2"
              stroke="var(--stroke-0, #787774)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}

function HugeiconsGoogleDoc() {
  return (
    <div
      className="overflow-clip relative shrink-0 size-6"
      data-name="hugeicons:google-doc"
    >
      <Group1 />
    </div>
  );
}

function Frame1261152792() {
  return (
    <div className="box-border content-stretch flex flex-row gap-[11px] items-center justify-start p-0 relative shrink-0">
      <HugeiconsGoogleDoc />
      <div className="font-['Plus_Jakarta_Sans:Regular',_sans-serif] font-normal leading-[0] relative shrink-0 text-[#787774] text-[16px] text-left w-[101px]">
        <p className="block leading-[20px]">Documents</p>
      </div>
    </div>
  );
}

function PhUserSwitchLight() {
  return (
    <div
      className="relative shrink-0 size-[26px]"
      data-name="ph:user-switch-light"
    >
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 26 26"
      >
        <g id="ph:user-switch-light">
          <path
            d={svgPaths.p1dbc500}
            fill="var(--fill-0, #787774)"
            id="Vector"
          />
        </g>
      </svg>
    </div>
  );
}

function Frame1261152794() {
  return (
    <div className="box-border content-stretch flex flex-row gap-[11px] items-center justify-start p-0 relative shrink-0">
      <PhUserSwitchLight />
      <div className="font-['Plus_Jakarta_Sans:Regular',_sans-serif] font-normal leading-[0] relative shrink-0 text-[#787774] text-[16px] text-left w-[193px]">
        <p className="block leading-[20px]">Switch to Tenant account</p>
      </div>
    </div>
  );
}

function Frame1261152795() {
  return (
    <div className="absolute bottom-[59.754%] box-border content-stretch flex flex-col gap-[52px] items-start justify-start left-[11.746%] p-0 right-[14.603%] top-[6.16%]">
      <Frame1261152787 />
      <Frame1261152788 />
      <Frame1261152791 />
      <Frame1261152792 />
      <Frame1261152794 />
    </div>
  );
}

function Rectangle2() {
  return (
    <div className="absolute bg-[#ffffff] h-[974px] left-0 shadow-[0px_4px_24px_0px_rgba(168,168,168,0.25)] top-[178px] w-72">
      <Frame1261152795 />
      <div className="absolute bottom-[90.246%] flex items-center justify-center left-[99.653%] right-[0.347%] top-[5.544%]">
        <div className="flex-none h-px rotate-[90deg] w-[41px]">
          <div className="relative size-full">
            <svg
              className="block size-full"
              fill="none"
              preserveAspectRatio="none"
              viewBox="0 0 32 32"
            >
              <g id="Line 189"></g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarColumnHeader() {
  return (
    <div
      className="h-12 relative shrink-0 w-full"
      data-name="Calendar/Column header"
    >
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col h-12 items-start justify-start pb-3 pl-[52px] pr-3 pt-0 w-full" />
      </div>
    </div>
  );
}

function Scroll() {
  return (
    <div className="h-[227px] relative shrink-0 w-4" data-name="Scroll">
      <div
        className="absolute bg-[#dcdfe3] h-[219px] left-1 rounded-lg top-1 w-2"
        data-name="Scroll"
      />
    </div>
  );
}

function Scroll1() {
  return (
    <div
      className="absolute bg-[#ffffff] box-border content-stretch flex flex-col h-[811px] items-start justify-start left-[1098px] p-0 rounded-[22px] shadow-[0px_4px_24px_0px_rgba(168,168,168,0.25)] top-11"
      data-name="Scroll"
    >
      <CalendarColumnHeader />
      <Scroll />
    </div>
  );
}

function Background() {
  return (
    <div
      className="absolute contents left-[37px] top-[93px]"
      data-name="Background"
    >
      <div
        className="absolute backdrop-blur-[10.5px] backdrop-filter h-[85px] left-[37px] rounded-[15px] top-[93px] w-[584px]"
        style={{
          backgroundImage:
            "linear-gradient(160.928deg, rgba(228, 240, 248, 0.24) 0%, rgba(255, 255, 255, 0.192) 110.84%)",
        }}
      >
        <div className="absolute border border-[#ffffff] border-solid inset-[-1px] pointer-events-none rounded-2xl shadow-[0px_2px_5.5px_0px_rgba(0,0,0,0.02)]" />
      </div>
    </div>
  );
}

function Group220() {
  return (
    <div className="absolute contents left-[37px] top-[93px]">
      <Background />
      <div className="absolute font-['Plus_Jakarta_Sans:Regular',_sans-serif] font-normal leading-[0] left-16 text-[#787774] text-[16px] text-left top-[137px] w-[442px]">
        <p className="block leading-[24px]">Flat 4B, Palm Grove Apartment</p>
      </div>
      <div className="absolute bg-[#6688ff] h-[85px] left-[38px] rounded-bl-[15px] rounded-tl-[15px] top-[93px] w-3.5" />
      <div className="absolute font-['Plus_Jakarta_Sans:Bold',_sans-serif] font-bold leading-[0] left-16 text-[#787774] text-[16px] text-left text-nowrap top-[109px]">
        <p className="block leading-[24px] whitespace-pre">
          Mary James submitted a new service request: “Leaking bathroom tap.
        </p>
      </div>
    </div>
  );
}

function Background1() {
  return (
    <div
      className="absolute contents left-[37px] top-[197px]"
      data-name="Background"
    >
      <div
        className="absolute backdrop-blur-[10.5px] backdrop-filter h-[85px] left-[37px] rounded-[15px] top-[197px] w-[584px]"
        style={{
          backgroundImage:
            "linear-gradient(160.928deg, rgba(228, 240, 248, 0.24) 0%, rgba(255, 255, 255, 0.192) 110.84%)",
        }}
      >
        <div className="absolute border border-[#ffffff] border-solid inset-[-1px] pointer-events-none rounded-2xl shadow-[0px_2px_5.5px_0px_rgba(0,0,0,0.02)]" />
      </div>
    </div>
  );
}

function Group221() {
  return (
    <div className="absolute contents left-[37px] top-[197px]">
      <Background1 />
      <div className="absolute font-['Plus_Jakarta_Sans:Regular',_sans-serif] font-normal leading-[0] left-16 text-[#787774] text-[16px] text-left top-[241px] w-[442px]">
        <p className="block leading-[24px]">Flat 3C, Harmony Court</p>
      </div>
      <div className="absolute bg-[#f55d5d] h-[85px] left-[38px] rounded-bl-[15px] rounded-tl-[15px] top-[197px] w-3.5" />
      <div className="absolute font-['Plus_Jakarta_Sans:Bold',_sans-serif] font-bold leading-[0] left-16 text-[#787774] text-[16px] text-left text-nowrap top-[213px]">
        <p className="block leading-[20px] whitespace-pre">
          Lease for David Ojo expires in 45 days
        </p>
      </div>
    </div>
  );
}

function Background2() {
  return (
    <div
      className="absolute contents left-[37px] top-[302px]"
      data-name="Background"
    >
      <div
        className="absolute backdrop-blur-[10.5px] backdrop-filter h-[85px] left-[37px] rounded-[15px] top-[302px] w-[584px]"
        style={{
          backgroundImage:
            "linear-gradient(160.928deg, rgba(228, 240, 248, 0.24) 0%, rgba(255, 255, 255, 0.192) 110.84%)",
        }}
      >
        <div className="absolute border border-[#ffffff] border-solid inset-[-1px] pointer-events-none rounded-2xl shadow-[0px_2px_5.5px_0px_rgba(0,0,0,0.02)]" />
      </div>
    </div>
  );
}

function Group222() {
  return (
    <div className="absolute contents left-[37px] top-[302px]">
      <Background2 />
      <div className="absolute font-['Plus_Jakarta_Sans:Regular',_sans-serif] font-normal leading-[0] left-16 text-[#787774] text-[16px] text-left top-[346px] w-[442px]">
        <p className="block leading-[24px]">Flat 3C, Harmony Court</p>
      </div>
      <div className="absolute bg-[#ee9239] h-[85px] left-[38px] rounded-bl-[15px] rounded-tl-[15px] top-[302px] w-3.5" />
      <div className="absolute font-['Plus_Jakarta_Sans:Bold',_sans-serif] font-bold leading-[0] left-16 text-[#787774] text-[16px] text-left text-nowrap top-[318px]">
        <p className="block leading-[20px] whitespace-pre">
          Chinedu Samuel completed tenant registration
        </p>
      </div>
    </div>
  );
}

function Background3() {
  return (
    <div
      className="absolute contents left-[37px] top-[474px]"
      data-name="Background"
    >
      <div
        className="absolute backdrop-blur-[10.5px] backdrop-filter h-[85px] left-[37px] rounded-[15px] top-[474px] w-[584px]"
        style={{
          backgroundImage:
            "linear-gradient(160.928deg, rgba(228, 240, 248, 0.24) 0%, rgba(255, 255, 255, 0.192) 110.84%)",
        }}
      >
        <div className="absolute border border-[#ffffff] border-solid inset-[-1px] pointer-events-none rounded-2xl shadow-[0px_2px_5.5px_0px_rgba(0,0,0,0.02)]" />
      </div>
    </div>
  );
}

function Group223() {
  return (
    <div className="absolute contents left-[37px] top-[474px]">
      <Background3 />
      <div className="absolute font-['Plus_Jakarta_Sans:Regular',_sans-serif] font-normal leading-[0] left-16 text-[#787774] text-[16px] text-left top-[518px] w-[442px]">
        <p className="block leading-[24px]">
          3-Bedroom Duplex, 12B Lekki Phase 1
        </p>
      </div>
      <div className="absolute bg-[#2cbe82] h-[85px] left-[38px] rounded-bl-[15px] rounded-tl-[15px] top-[474px] w-3.5" />
      <div className="absolute font-['Plus_Jakarta_Sans:Bold',_sans-serif] font-bold leading-[0] left-16 text-[#787774] text-[16px] text-left text-nowrap top-[490px]">
        <p className="block leading-[20px] whitespace-pre">
          You added a new property
        </p>
      </div>
    </div>
  );
}

function Frame1984077969() {
  return (
    <div className="absolute bg-[#ffffff] bottom-[2.257%] left-[20%] right-[0.069%] top-[20.052%]">
      <div className="overflow-clip relative size-full">
        <Scroll1 />
        <div
          className="absolute font-['Roboto:Regular',_sans-serif] font-normal leading-[0] left-[37px] text-[#8d8d8d] text-[16px] text-left text-nowrap top-[60px]"
          style={{ fontVariationSettings: "'wdth' 100" }}
        >
          <p className="block leading-[14px] whitespace-pre">1st June, 2025</p>
        </div>
        <div
          className="absolute font-['Roboto:Regular',_sans-serif] font-normal leading-[0] left-[37px] text-[#8d8d8d] text-[16px] text-left text-nowrap top-[434px]"
          style={{ fontVariationSettings: "'wdth' 100" }}
        >
          <p className="block leading-[14px] whitespace-pre">2nd June, 2025</p>
        </div>
        <div className="absolute h-0 left-[170px] top-[67px] w-[500px]">
          <div className="absolute bottom-0 left-0 right-0 top-[-2px]">
            <svg
              className="block size-full"
              fill="none"
              preserveAspectRatio="none"
              viewBox="0 0 500 2"
            >
              <line
                id="Line 10"
                stroke="var(--stroke-0, black)"
                strokeDasharray="0 10"
                strokeLinecap="round"
                strokeOpacity="0.1"
                strokeWidth="2"
                x1="1"
                x2="499"
                y1="1"
                y2="1"
              />
            </svg>
          </div>
        </div>
        <div className="absolute h-0 left-[170px] top-[441px] w-[500px]">
          <div className="absolute bottom-0 left-0 right-0 top-[-2px]">
            <svg
              className="block size-full"
              fill="none"
              preserveAspectRatio="none"
              viewBox="0 0 500 2"
            >
              <line
                id="Line 10"
                stroke="var(--stroke-0, black)"
                strokeDasharray="0 10"
                strokeLinecap="round"
                strokeOpacity="0.1"
                strokeWidth="2"
                x1="1"
                x2="499"
                y1="1"
                y2="1"
              />
            </svg>
          </div>
        </div>
        <Group220 />
        <Group221 />
        <Group222 />
        <Group223 />
      </div>
      <div className="absolute border-[#cacdd8] border-[0px_0px_0px_1px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function Heading() {
  return (
    <div
      className="box-border content-stretch flex flex-col h-full items-start justify-start p-0 relative shrink-0"
      data-name="Heading"
    >
      <div className="css-fhdulx font-['Plus_Jakarta_Sans:Regular',_sans-serif] font-normal leading-[0] relative shrink-0 text-[#121c2d] text-[18px] text-left text-nowrap">
        <p className="block leading-[20px] whitespace-pre">
          See what’s happening across your properties
        </p>
      </div>
    </div>
  );
}

function Title() {
  return (
    <div
      className="absolute bg-[#ffffff] left-72 top-[178px] w-[1151px]"
      data-name="title"
    >
      <div className="box-border content-stretch flex flex-row gap-[582px] items-center justify-start overflow-clip px-[46px] py-4 relative w-[1151px]">
        <div className="flex flex-row items-center self-stretch">
          <Heading />
        </div>
      </div>
      <div className="absolute border-[#cacdd8] border-[0px_0px_1px_1px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

export default function HomeDashboard() {
  return (
    <div className="bg-[#fafafe] relative size-full" data-name="Home Dashboard">
      <Header />
      <Rectangle2 />
      <Frame1984077969 />
      <Title />
    </div>
  );
}