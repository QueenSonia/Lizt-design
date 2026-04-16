# KYC Components

This directory contains the redesigned multi-step KYC form components.

## Structure

- `types/` - TypeScript interfaces and types
- `constants/` - Step definitions and validation rules
- `services/` - Cloudinary and OTP services
- `utils/` - Form validation utilities
- `components/` - UI components for the multi-step form
  - `ui/` - Core UI components (StepCard, VerticalStepTracker, etc.)
  - `steps/` - Individual form step components
  - `forms/` - Main form container and navigation

## Usage

The main entry point is the `MultiStepForm` component which orchestrates the entire KYC form flow.
