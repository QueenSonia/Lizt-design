/* eslint-disable */
import { useState, useEffect } from 'react'
import image1 from './f84026009aa029bb7f1fb22bea82e5c03f2ce8ba.png'
import image2 from './d35024f70d6c4cb49f4449f9f636ec12a5f799ad.png'
import image3 from './60be66c22c2a7ed653bd028aad1cace3f24b339a.png'
import image4 from './63748f792859661113fb851dd4e945f3218764a6.png'
import image5 from './cb9bd694161d7616aa1a00d35b54c50e401dc485.png'
import image6 from './1b696c9a4c9c2da9a01c16cebcce4388d5d51682.png'
import image7 from './dfc6a0ad1c0845f8f1a02a90130cbbcc9afba509.png'
import image8 from './3a9f1047a854dadf6e85e7055436399771a76623.png'

const images = [
  {
    src: './f84026009aa029bb7f1fb22bea82e5c03f2ce8ba.png',
    alt: "Professional using WhatsApp for property management"
  },
  {
    src: './d35024f70d6c4cb49f4449f9f636ec12a5f799ad.png',
    alt: "Property manager communicating via mobile app"
  },
  {
    src: './60be66c22c2a7ed653bd028aad1cace3f24b339a.png',
    alt: "Real estate professional managing properties digitally"
  },
  {
    src: './63748f792859661113fb851dd4e945f3218764a6.png',
    alt: "Young professional using mobile phone for business communication"
  },
  {
    src: './cb9bd694161d7616aa1a00d35b54c50e401dc485.png',
    alt: "Property manager using smartphone for tenant communication"
  },
  {
    src: './1b696c9a4c9c2da9a01c16cebcce4388d5d51682.png',
    alt: "Real estate professional managing rentals via mobile app"
  },
  {
    src: './dfc6a0ad1c0845f8f1a02a90130cbbcc9afba509.png',
    alt: "Business professional using mobile phone for property management"
  },
  {
    src: './3a9f1047a854dadf6e85e7055436399771a76623.png',
    alt: "Property manager relaxing at home while managing rentals via smartphone"
  }
] as {src:any, alt:string}[]

interface HeroCarouselProps {
  asBackground?: boolean
  asPortrait?: boolean
  asHalfWidth?: boolean
  asFullScreen?: boolean
  noOverlay?: boolean
  children?: React.ReactNode
}

export function HeroCarousel({ 
  asBackground = false, 
  asPortrait = false, 
  asHalfWidth = false, 
  asFullScreen = false,
  noOverlay = false,
  children 
}: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (isHovered) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      )
    }, 3500) // 3.5 seconds for smooth cycling

    return () => clearInterval(interval)
  }, [isHovered])

  if (asPortrait) {
    return (
      <div 
        className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] rounded-2xl overflow-hidden shadow-2xl"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Portrait Images */}
        <div className="relative w-full h-full">
          {images.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover object-center"
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
          
          {/* Subtle gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        </div>
        
        {/* Carousel Indicators - Invisible but functional */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className="w-2 h-2 rounded-full opacity-0 cursor-pointer"
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      </div>
    )
  }

  if (asFullScreen) {
    return (
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Full-Screen Background Images */}
        <div className="absolute inset-0">
          {images.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover object-center"
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>
        
        {/* Content overlay - only if children provided */}
        {children && (
          <div className="relative z-10 w-full h-full">
            {children}
          </div>
        )}
        
        {/* Carousel Indicators - Invisible but functional */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className="w-3 h-3 rounded-full opacity-0 cursor-pointer"
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      </div>
    )
  }

  if (asBackground) {
    return (
      <div 
        className="relative w-full min-h-[600px] lg:min-h-[700px] overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Background Images */}
        <div className="absolute inset-0">
          {images.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover object-right"
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
          
          {!noOverlay && (
            <>
              {/* Dark gradient overlay from left to middle for text contrast */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
              
              {/* Subtle gradient from bottom for depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </>
          )}
        </div>
        
        {/* Content overlay */}
        <div className="relative z-10 h-full">
          {children}
        </div>
        
        {/* Carousel Indicators - Invisible but functional */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className="w-3 h-3 rounded-full opacity-0 cursor-pointer"
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      </div>
    )
  }

  if (asHalfWidth) {
    return (
      <div 
        className="relative w-full h-full overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Half-width spanning images */}
        <div className="absolute inset-0">
          {images.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover object-center"
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>
        
        {/* Carousel Indicators - Invisible but functional */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className="w-2 h-2 rounded-full opacity-0 cursor-pointer"
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      </div>
    )
  }

  // Original carousel component for other uses
  return (
    <div 
      className="relative rounded-2xl overflow-hidden shadow-2xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative w-full h-auto aspect-[4/3]">
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-full object-cover"
              loading={index === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        
        {/* Carousel Indicators - Invisible but functional */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className="w-2 h-2 rounded-full opacity-0 cursor-pointer"
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}