# Design Notes — HPCL-themed Dashboard (Discovery)

Header & navigation structure
-----------------------------
- Top header with HPCL logo (left), global utility links (search, notifications, user profile) on right.
- Primary navigation: Dashboard | Purchase Requests | Approvals | Rules | Reports | Admin
- Secondary navigation: contextual tabs within each module (e.g., Approvals → Pending, Escalations, History)

Suggested color palette (HPCL-inspired)
---------------------------------------
- Primary blue: #003366 (deep HPCL blue)
- Accent red: #E4002B (HPCL red)
- Golden accent: #FFB400
- Dark navy (text): #001F3F
- Neutral light: #F8FAFB
- White: #FFFFFF

Typography suggestions
----------------------
- Primary font: `Poppins`, fallback `Roboto`, system sans-serif
- Sizes: base 16px; headings H1 28px, H2 22px, H3 18px; body 16px; small 13px

Button styles
-------------
- Primary button: filled `#003366` background, white text, subtle shadow, 8px radius
- Secondary button: white background, `#003366` border and text
- Danger/alert button: `#E4002B` background, white text

Accessibility notes
-------------------
- Ensure 4.5:1 contrast for body text against background
- Provide font-size controls and large-text mode in settings
- Include skip-to-content link for screen readers
- Ensure all actionable items have accessible names and keyboard focus states

Example CSS snippet (header + primary button)
--------------------------------------------
```css
.hpcl-header {
  background: linear-gradient(90deg, #003366 0%, #001F3F 100%);
  color: #fff;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.hpcl-header .nav { display:flex; gap:20px; align-items:center }
.hpcl-btn-primary {
  background-color: #003366;
  color: #fff;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
}
```

Notes
-----
Design should prioritize clarity for approval tasks: large type for amounts, colored badges for rule severity, and an actions rail for quick approve/reject with comment capture.
