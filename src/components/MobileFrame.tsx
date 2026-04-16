import { ReactNode } from 'react'
import { Wifi, Battery, Signal } from 'lucide-react'

interface MobileFrameProps {
  children: ReactNode
}

export function MobileFrame({ children }: MobileFrameProps) {
  // Get current time
  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false
    })
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
      {/* iPhone Frame */}
      <div className="relative">
        {/* Outer Frame */}
        <div className="w-[390px] h-[844px] bg-black rounded-[50px] p-2 shadow-2xl">
          {/* Inner Frame */}
          <div className="w-full h-full bg-black rounded-[42px] overflow-hidden">
            {/* Screen */}
            <div className="relative w-full h-full bg-white overflow-hidden">
              {/* Status Bar */}
              <div className="absolute top-0 left-0 right-0 z-[100] bg-white">
                {/* Notch */}
                <div className="flex justify-center">
                  <div className="w-[154px] h-[30px] bg-black rounded-b-[15px]"></div>
                </div>
                
                {/* Status Bar Content */}
                <div className="flex items-center justify-between px-8 py-2 -mt-[30px]">
                  <div className="flex items-center space-x-1 text-black text-sm font-medium pl-4">
                    <span>{getCurrentTime()}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1 pr-4">
                    <Signal className="w-4 h-4 text-black fill-current" />
                    <Wifi className="w-4 h-4 text-black" />
                    <div className="relative">
                      <Battery className="w-6 h-3 text-black" />
                      <div className="absolute inset-0 w-4 h-2 bg-green-500 rounded-sm ml-0.5 mt-0.5"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* App Content Container */}
              <div className="relative w-full h-full pt-[64px] pb-[34px] overflow-hidden">
                {children}
              </div>

              {/* Home Indicator */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-[100]">
                <div className="w-[134px] h-[5px] bg-black rounded-full opacity-40"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Physical Buttons */}
        {/* Volume Buttons */}
        <div className="absolute left-[-3px] top-[120px] w-[3px] h-[32px] bg-gray-800 rounded-l-sm"></div>
        <div className="absolute left-[-3px] top-[170px] w-[3px] h-[32px] bg-gray-800 rounded-l-sm"></div>
        
        {/* Power Button */}
        <div className="absolute right-[-3px] top-[200px] w-[3px] h-[60px] bg-gray-800 rounded-r-sm"></div>

        {/* Camera */}
        <div className="absolute top-[14px] left-1/2 transform -translate-x-1/2 w-[12px] h-[12px] bg-gray-800 rounded-full"></div>
        
        {/* Speaker */}
        <div className="absolute top-[16px] left-1/2 transform -translate-x-1/2 translate-x-[20px] w-[40px] h-[6px] bg-gray-800 rounded-full"></div>
      </div>

      {/* Device Info */}
      <div className="absolute bottom-4 left-4 text-gray-400 text-sm">
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="font-medium text-white">Property Manager Dashboard</div>
          <div className="text-xs mt-1">iPhone 14 Pro • iOS 17</div>
        </div>
      </div>
    </div>
  )
}