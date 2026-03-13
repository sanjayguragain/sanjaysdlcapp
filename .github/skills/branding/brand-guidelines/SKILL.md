---
name: brand-guidelines
description: Applies Edison's official brand colors and typography to any sort of artifact that may benefit from having Edison's look-and-feel. Use it when brand colors or style guidelines, visual formatting, or company design standards apply.
license: Complete terms in LICENSE.txt
---

# Edison Brand Styling

## Overview

To access Edison's official brand identity and style resources, use this skill.

**Keywords**: branding, corporate identity, visual identity, post-processing, styling, brand colors, typography, Edison brand, visual formatting, visual design

## Brand Guidelines

### Colors

**Main Colors:**

- Dark: `#101820` - Primary text and dark backgrounds
- Light: `#B1B3B3` - Light backgrounds and text on dark
- Mid Gray: `#53565A` - Secondary elements
- Light Gray: `#707372` - Subtle backgrounds

**Accent Colors:**

- Orange: `#E87722` - Primary accent
- Blue: `#00A9E0` - Secondary accent
- Green: `#658D1B` - Tertiary accent
- Aqua: `#006269` - Additional accent
- Yellow: `#F0B323` - Additional accent
- Red: `#722257` - Additional accent
- Yellow-Green: `#D2D755` - Additional accent

### Typography

- Open Sans: Primary font for headings and body text
- Segoe, Arial, Helvetica: Fallback fonts

## Features

### Smart Font Application

- Applies Bold font to headings (24pt and larger)
- Applies Semi-Bold font to subheadings and links within body text
- Applies Regular font to body text (below 24pt)
- Preserves readability across all systems

### Text Styling

- Headings (24pt+): Open Sans font
- Body text: Open Sans font
- Smart color selection based on background
- Preserves text hierarchy and formatting

### Shape and Accent Colors

- Non-text shapes use accent colors
- Cycles through orange, blue, and green accents
- Maintains visual interest while staying on-brand

## Technical Details

### Font Management

- Uses system-installed Open Sans font when available
- Provides automatic fallback to Arial (headings) and Georgia (body)
- No font installation required - works with existing system fonts
- For best results, pre-install Open Sans font in your environment

### Color Application

- Uses RGB color values for precise brand matching
- Applied via python-pptx's RGBColor class
- Maintains color fidelity across different systems
