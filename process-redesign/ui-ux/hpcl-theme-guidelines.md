# HPCL Theme Guidelines - Design System

## Overview
This document defines the comprehensive design system for the HPCL Procurement Automation System, ensuring brand consistency across all screens, components, and user touchpoints. Based on official HPCL branding from hindustanpetroleum.com.

---

## 1. Color Palette

### Primary Colors
```css
--hpcl-blue-primary: #003366    /* Navy Blue - Primary brand color */
--hpcl-red-accent: #E4002B      /* Red - Call-to-action, alerts */
--hpcl-golden: #FFB400          /* Golden - Highlights, success states */
--hpcl-navy: #001F3F            /* Dark Navy - Darker elements */
```

**Usage Guidelines:**
- **Primary Blue (#003366)**: Headers, navigation bars, primary buttons, active states
- **Accent Red (#E4002B)**: CTAs (Create PR, Approve), urgent flags, critical exceptions
- **Golden (#FFB400)**: Success indicators, premium features, awards
- **Dark Navy (#001F3F)**: Footer, sidebar backgrounds, deep contrast elements

### Semantic Colors
```css
--success-green: #28A745        /* Approved, completed, compliant */
--warning-yellow: #FFC107       /* Pending, caution, in-progress */
--error-red: #DC3545            /* Rejected, blocked, critical errors */
--info-blue: #17A2B8            /* Informational messages */
--disabled-gray: #6C757D        /* Disabled buttons, inactive elements */
```

### Neutral Shades
```css
--neutral-light: #F8FAFB        /* Page background, card backgrounds */
--neutral-light-gray: #E9ECEF   /* Borders, dividers */
--neutral-gray: #CED4DA         /* Secondary borders, placeholders */
--neutral-dark-gray: #495057    /* Body text, labels */
--neutral-black: #212529        /* Headings, primary text */
--white: #FFFFFF                /* Card backgrounds, input fields */
```

### Color Accessibility
- **Contrast Ratios** (WCAG 2.1 AA):
  - Text on Primary Blue (#003366): Use white (#FFFFFF) - Contrast 11.2:1 ✅
  - Text on Accent Red (#E4002B): Use white (#FFFFFF) - Contrast 8.1:1 ✅
  - Text on Golden (#FFB400): Use dark navy (#001F3F) - Contrast 9.5:1 ✅
  - Body text on light backgrounds: Use #212529 - Contrast 16.4:1 ✅

---

## 2. Typography

### Font Families
```css
--font-heading: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-body: 'Roboto', Arial, Helvetica, sans-serif;
--font-mono: 'Courier New', Courier, monospace;
```

**Font Loading:**
```html
<!-- Google Fonts CDN -->
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
```

### Font Sizes (Responsive Scale)
```css
/* Desktop (16px base) */
--text-xs: 0.75rem       /* 12px - Labels, captions */
--text-sm: 0.875rem      /* 14px - Secondary text, table cells */
--text-base: 1rem        /* 16px - Body text */
--text-lg: 1.125rem      /* 18px - Large body text */
--text-xl: 1.25rem       /* 20px - Section subheadings */
--text-2xl: 1.5rem       /* 24px - Card titles */
--text-3xl: 1.875rem     /* 30px - Page headings */
--text-4xl: 2.25rem      /* 36px - Hero headings */
--text-5xl: 3rem         /* 48px - Dashboard headings */

/* Mobile (14px base) */
@media (max-width: 768px) {
  --text-base: 0.875rem  /* 14px - Body text on mobile */
  --text-lg: 1rem        /* 16px - Larger body on mobile */
  --text-3xl: 1.5rem     /* 24px - Page headings on mobile */
}
```

### Font Weights
```css
--font-light: 300        /* Subtle text, timestamps */
--font-regular: 400      /* Body text */
--font-medium: 500       /* Emphasized text, labels */
--font-semibold: 600     /* Headings, buttons */
--font-bold: 700         /* Strong emphasis, alerts */
```

### Line Heights
```css
--line-height-tight: 1.2     /* Headings */
--line-height-normal: 1.5    /* Body text */
--line-height-relaxed: 1.75  /* Long-form content */
```

### Typography Usage
| Element              | Font        | Size        | Weight      | Color           |
|----------------------|-------------|-------------|-------------|-----------------|
| Page Heading (H1)    | Poppins     | 3xl (30px)  | 600         | #003366 (Blue)  |
| Section Heading (H2) | Poppins     | 2xl (24px)  | 600         | #001F3F (Navy)  |
| Card Title (H3)      | Poppins     | xl (20px)   | 600         | #212529 (Black) |
| Body Text            | Roboto      | base (16px) | 400         | #495057 (Gray)  |
| Button Text          | Poppins     | sm (14px)   | 600         | #FFFFFF (White) |
| Label                | Roboto      | sm (14px)   | 500         | #212529 (Black) |
| Timestamp            | Roboto      | xs (12px)   | 300         | #6C757D (Gray)  |
| Code / PR IDs        | Courier New | sm (14px)   | 400         | #E4002B (Red)   |

---

## 3. Spacing System (8px Grid)

### Base Unit: 8px
```css
--space-0: 0px           /* No spacing */
--space-1: 0.25rem       /* 4px - Tight spacing */
--space-2: 0.5rem        /* 8px - Default gap */
--space-3: 0.75rem       /* 12px - Medium gap */
--space-4: 1rem          /* 16px - Standard padding */
--space-5: 1.25rem       /* 20px - Card padding */
--space-6: 1.5rem        /* 24px - Section spacing */
--space-8: 2rem          /* 32px - Large spacing */
--space-10: 2.5rem       /* 40px - Extra large spacing */
--space-12: 3rem         /* 48px - Hero spacing */
--space-16: 4rem         /* 64px - Mega spacing */
```

**Usage Examples:**
- **Card Padding**: `var(--space-5)` (20px)
- **Button Padding**: `var(--space-3) var(--space-6)` (12px 24px)
- **Section Margins**: `var(--space-8)` (32px)
- **Form Field Gaps**: `var(--space-4)` (16px)

---

## 4. Component Library

### 4.1 Buttons

#### Primary Button (CTA)
```css
.btn-primary {
  background-color: var(--hpcl-red-accent);
  color: var(--white);
  font-family: var(--font-heading);
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  padding: var(--space-3) var(--space-6);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
}

.btn-primary:hover {
  background-color: #C60024; /* Darker red */
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-primary:disabled {
  background-color: var(--disabled-gray);
  cursor: not-allowed;
}
```

#### Secondary Button (Outline)
```css
.btn-secondary {
  background-color: transparent;
  color: var(--hpcl-blue-primary);
  font-family: var(--font-heading);
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  padding: var(--space-3) var(--space-6);
  border: 2px solid var(--hpcl-blue-primary);
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

.btn-secondary:hover {
  background-color: var(--hpcl-blue-primary);
  color: var(--white);
}
```

#### Danger Button (Reject, Delete)
```css
.btn-danger {
  background-color: var(--error-red);
  color: var(--white);
  padding: var(--space-3) var(--space-6);
  border: none;
  border-radius: 6px;
  font-weight: var(--font-semibold);
}

.btn-danger:hover {
  background-color: #C82333; /* Darker red */
}
```

#### Icon Button
```css
.btn-icon {
  background-color: transparent;
  border: none;
  color: var(--hpcl-blue-primary);
  font-size: var(--text-xl);
  padding: var(--space-2);
  cursor: pointer;
  border-radius: 4px;
}

.btn-icon:hover {
  background-color: var(--neutral-light-gray);
}
```

### 4.2 Cards

```css
.card {
  background-color: var(--white);
  border: 1px solid var(--neutral-light-gray);
  border-radius: 8px;
  padding: var(--space-5);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s, transform 0.2s;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-header {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--neutral-black);
  margin-bottom: var(--space-4);
  border-bottom: 2px solid var(--hpcl-blue-primary);
  padding-bottom: var(--space-3);
}
```

### 4.3 Form Inputs

#### Text Input
```css
.form-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--neutral-black);
  background-color: var(--white);
  border: 1px solid var(--neutral-gray);
  border-radius: 6px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--hpcl-blue-primary);
  box-shadow: 0 0 0 3px rgba(0, 51, 102, 0.1);
}

.form-input:disabled {
  background-color: var(--neutral-light);
  color: var(--disabled-gray);
  cursor: not-allowed;
}

.form-input.error {
  border-color: var(--error-red);
}
```

#### Label
```css
.form-label {
  display: block;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--neutral-black);
  margin-bottom: var(--space-2);
}

.form-label.required::after {
  content: ' *';
  color: var(--error-red);
}
```

#### Dropdown (Select)
```css
.form-select {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--neutral-black);
  background-color: var(--white);
  border: 1px solid var(--neutral-gray);
  border-radius: 6px;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23495057' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

.form-select:focus {
  outline: none;
  border-color: var(--hpcl-blue-primary);
  box-shadow: 0 0 0 3px rgba(0, 51, 102, 0.1);
}
```

#### Textarea
```css
.form-textarea {
  width: 100%;
  min-height: 120px;
  padding: var(--space-3) var(--space-4);
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--neutral-black);
  background-color: var(--white);
  border: 1px solid var(--neutral-gray);
  border-radius: 6px;
  resize: vertical;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--hpcl-blue-primary);
  box-shadow: 0 0 0 3px rgba(0, 51, 102, 0.1);
}
```

### 4.4 Tables

```css
.table {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--white);
}

.table thead {
  background-color: var(--hpcl-blue-primary);
  color: var(--white);
}

.table th {
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  text-align: left;
  padding: var(--space-4);
  border-bottom: 2px solid var(--hpcl-navy);
}

.table td {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--neutral-dark-gray);
  padding: var(--space-4);
  border-bottom: 1px solid var(--neutral-light-gray);
}

.table tbody tr:hover {
  background-color: var(--neutral-light);
}

.table tbody tr:last-child td {
  border-bottom: none;
}
```

### 4.5 Status Badges

```css
.badge {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  border-radius: 12px;
}

.badge-success {
  background-color: #D4EDDA;
  color: #155724;
  border: 1px solid #C3E6CB;
}

.badge-warning {
  background-color: #FFF3CD;
  color: #856404;
  border: 1px solid #FFEAA7;
}

.badge-error {
  background-color: #F8D7DA;
  color: #721C24;
  border: 1px solid #F5C6CB;
}

.badge-info {
  background-color: #D1ECF1;
  color: #0C5460;
  border: 1px solid #BEE5EB;
}

.badge-neutral {
  background-color: var(--neutral-light-gray);
  color: var(--neutral-dark-gray);
  border: 1px solid var(--neutral-gray);
}
```

### 4.6 Progress Bars

```css
.progress-bar-container {
  width: 100%;
  height: 12px;
  background-color: var(--neutral-light-gray);
  border-radius: 6px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--hpcl-blue-primary), var(--hpcl-golden));
  border-radius: 6px;
  transition: width 0.4s ease-in-out;
}

.progress-bar-label {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--neutral-dark-gray);
  margin-top: var(--space-1);
}
```

### 4.7 Modals

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--white);
  border-radius: 12px;
  padding: var(--space-8);
  max-width: 600px;
  width: 90%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.modal-header {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  font-weight: var(--font-semibold);
  color: var(--hpcl-blue-primary);
  margin-bottom: var(--space-5);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-4);
  margin-top: var(--space-6);
}
```

### 4.8 Notifications / Toasts

```css
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: var(--white);
  border-left: 4px solid var(--success-green);
  border-radius: 8px;
  padding: var(--space-4);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 400px;
  z-index: 1100;
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-success {
  border-left-color: var(--success-green);
}

.toast-error {
  border-left-color: var(--error-red);
}

.toast-warning {
  border-left-color: var(--warning-yellow);
}

.toast-info {
  border-left-color: var(--info-blue);
}

.toast-content {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--neutral-black);
}
```

---

## 5. Iconography

### Icon Library: Material Icons
```html
<!-- CDN Link -->
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
```

### Icon Usage
| Context              | Icon Name           | Color               |
|----------------------|---------------------|---------------------|
| Create PR            | add_circle_outline  | #E4002B (Red)       |
| Approve              | check_circle        | #28A745 (Green)     |
| Reject               | cancel              | #DC3545 (Red)       |
| Pending              | schedule            | #FFC107 (Yellow)    |
| Notifications        | notifications       | #003366 (Blue)      |
| Settings             | settings            | #495057 (Gray)      |
| User Profile         | account_circle      | #003366 (Blue)      |
| Download             | cloud_download      | #003366 (Blue)      |
| Upload               | cloud_upload        | #003366 (Blue)      |
| Search               | search              | #495057 (Gray)      |
| Filter               | filter_list         | #495057 (Gray)      |
| Calendar             | event               | #003366 (Blue)      |
| Money                | attach_money        | #FFB400 (Golden)    |

### Icon Sizes
```css
.icon-xs  { font-size: 16px; }
.icon-sm  { font-size: 20px; }
.icon-md  { font-size: 24px; }
.icon-lg  { font-size: 32px; }
.icon-xl  { font-size: 48px; }
```

---

## 6. Layout & Grid

### Responsive Breakpoints
```css
/* Mobile */
@media (max-width: 576px) { /* Smartphones */ }

/* Tablet */
@media (min-width: 577px) and (max-width: 768px) { /* Tablets */ }

/* Desktop */
@media (min-width: 769px) and (max-width: 1024px) { /* Small laptops */ }

/* Large Desktop */
@media (min-width: 1025px) { /* Full-size monitors */ }
```

### Container
```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-5);
}

@media (max-width: 768px) {
  .container {
    padding: 0 var(--space-4);
  }
}
```

### Grid System (12-column)
```css
.row {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-4);
}

.col-1  { grid-column: span 1; }
.col-2  { grid-column: span 2; }
.col-3  { grid-column: span 3; }
.col-4  { grid-column: span 4; }
.col-6  { grid-column: span 6; }
.col-8  { grid-column: span 8; }
.col-12 { grid-column: span 12; }

@media (max-width: 768px) {
  .col-1, .col-2, .col-3, .col-4, .col-6, .col-8 {
    grid-column: span 12; /* Stack on mobile */
  }
}
```

---

## 7. Accessibility (WCAG 2.1 AA)

### Keyboard Navigation
- **Tab Order**: Logical flow (top-left → bottom-right)
- **Focus Indicators**: 3px solid blue outline (`outline: 3px solid #003366;`)
- **Skip Links**: "Skip to main content" for screen readers
- **ARIA Labels**: All interactive elements have `aria-label` or `aria-labelledby`

### Screen Reader Support
```html
<!-- Example: Button with screen reader text -->
<button class="btn-icon" aria-label="Download PR-2025-05-001">
  <span class="material-icons">cloud_download</span>
</button>

<!-- Example: Status badge -->
<span class="badge badge-success" role="status" aria-live="polite">
  Approved
</span>
```

### Color Contrast
- **Text on Primary Blue**: #FFFFFF (white) - 11.2:1 contrast ✅
- **Text on Light Backgrounds**: #212529 (black) - 16.4:1 contrast ✅
- **Interactive Elements**: Minimum 4.5:1 contrast for normal text

### Focus Management
```css
:focus-visible {
  outline: 3px solid var(--hpcl-blue-primary);
  outline-offset: 2px;
}

button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  box-shadow: 0 0 0 3px rgba(0, 51, 102, 0.2);
}
```

---

## 8. Animation & Transitions

### Standard Transitions
```css
--transition-fast: 0.1s ease-in-out;
--transition-normal: 0.2s ease-in-out;
--transition-slow: 0.4s ease-in-out;
```

### Hover Effects
```css
.hover-lift {
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

### Loading Spinner
```css
.spinner {
  border: 4px solid var(--neutral-light-gray);
  border-top: 4px solid var(--hpcl-blue-primary);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

---

## 9. Mobile Responsiveness

### Touch Targets
- **Minimum Size**: 48x48px (Apple HIG / Material Design)
- **Spacing**: 8px minimum between touch targets

### Mobile Navigation
```css
.mobile-menu-toggle {
  display: none;
  background-color: transparent;
  border: none;
  font-size: 28px;
  color: var(--white);
  cursor: pointer;
}

@media (max-width: 768px) {
  .mobile-menu-toggle {
    display: block;
  }

  .desktop-nav {
    display: none;
  }
}
```

### Responsive Typography
```css
h1 {
  font-size: var(--text-5xl);
}

@media (max-width: 768px) {
  h1 {
    font-size: var(--text-3xl);
  }
}
```

---

## 10. Custom HPCL Elements

### Header Bar
```css
.hpcl-header {
  background: linear-gradient(90deg, var(--hpcl-blue-primary), var(--hpcl-navy));
  color: var(--white);
  padding: var(--space-4) var(--space-6);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.hpcl-logo {
  height: 40px;
  width: auto;
}
```

### Footer
```css
.hpcl-footer {
  background-color: var(--hpcl-navy);
  color: var(--neutral-light-gray);
  padding: var(--space-8) var(--space-6);
  text-align: center;
  font-size: var(--text-sm);
}

.hpcl-footer a {
  color: var(--hpcl-golden);
  text-decoration: none;
}

.hpcl-footer a:hover {
  text-decoration: underline;
}
```

---

## 11. Print Styles

```css
@media print {
  .no-print {
    display: none;
  }

  body {
    font-size: 12pt;
    color: #000;
    background: #fff;
  }

  .card {
    page-break-inside: avoid;
  }

  a[href]:after {
    content: " (" attr(href) ")";
  }
}
```

---

## 12. Design Tokens (JSON Export)

For integration with React/Vue/Angular:

```json
{
  "colors": {
    "primary": "#003366",
    "accent": "#E4002B",
    "golden": "#FFB400",
    "navy": "#001F3F",
    "success": "#28A745",
    "warning": "#FFC107",
    "error": "#DC3545",
    "neutralLight": "#F8FAFB",
    "neutralBlack": "#212529"
  },
  "spacing": {
    "xs": "4px",
    "sm": "8px",
    "md": "16px",
    "lg": "24px",
    "xl": "32px"
  },
  "typography": {
    "fontHeading": "Poppins, sans-serif",
    "fontBody": "Roboto, Arial, sans-serif",
    "sizeSm": "14px",
    "sizeBase": "16px",
    "sizeLg": "18px",
    "sizeXl": "20px"
  },
  "borderRadius": {
    "sm": "4px",
    "md": "6px",
    "lg": "8px",
    "xl": "12px"
  }
}
```

---

**Document Version**: 1.0  
**Last Updated**: November 2025  
**Owner**: HPCL Digital Transformation Team  
**WCAG Compliance**: AA (Level 2.1)
