"use client";
import React, { ReactNode } from "react";
import { useNavigation } from "@/contexts/NavigationContext";
import { useMobile } from "@/contexts/MobileContext";

interface LandlordScreenWrapperProps {
  children: ReactNode;
}

export function LandlordScreenWrapper({
  children,
}: LandlordScreenWrapperProps) {
  const { setIsMobileSidebarOpen } = useNavigation();
  const { isMobile } = useMobile();

  // Clone the children and inject the mobile props
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        onMenuClick: () => setIsMobileSidebarOpen(true),
        isMobile,
      } as Record<string, unknown>);
    }
    return child;
  });

  return <>{childrenWithProps}</>;
}

// Higher-order component to wrap landlord screens
export function withLandlordMobileProps<T extends object>(
  Component: React.ComponentType<T>
) {
  return function WrappedComponent(props: T) {
    const { setIsMobileSidebarOpen } = useNavigation();
    const { isMobile } = useMobile();

    return (
      <Component
        {...props}
        onMenuClick={() => setIsMobileSidebarOpen(true)}
        isMobile={isMobile}
      />
    );
  };
}
