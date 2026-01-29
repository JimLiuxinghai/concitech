# Landing Page Design (Concitech)

Date: 2026-01-29
Owner: JimLiu
Scope: Personal portfolio landing page (single screen)

## Summary
A single-screen, future-tech styled landing page to present JimLiu and highlight key projects. The page emphasizes clarity: identity and links on the left, projects on the right. It is a static HTML/CSS page with minimal JS, optimized for fast load and easy maintenance.

## Goals
- Present identity clearly (JimLiu + Geeker) with a short bilingual, playful statement.
- Showcase 2 current projects and a "More coming" placeholder.
- Provide direct GitHub and X links.
- Maintain a light, futuristic look with subtle motion.
- Keep the implementation minimal and easy to update.

## Non-Goals
- No CMS or dynamic content management.
- No complex interactions or heavy animations.
- No avatar or personal photo for now.

## Information Architecture
Single screen with two columns on desktop:
- Left: Hero
  - Name: JimLiu
  - Role: Geeker
  - One bilingual playful line (short)
  - Social links: GitHub, X
- Right: Project cards grid
  - Blog (blog.concitech.org)
  - Tweet Craft (tweet-craft.concitech.org)
  - "More coming" placeholder (non-clickable)

Mobile layout stacks vertically: Hero first, then cards.

## Layout
- Desktop: 2-column layout, approx 45% / 55%.
- Right column: 2-column card grid if width allows; otherwise 1-column.
- Single screen target: content fits within one viewport with minimal scrolling.

## Visual Style
- Background: very light cool gradient (fog white to pale cyan/blue) + fine grid texture.
- Primary text: deep gray / near-black for readability.
- Accent: cool cyan/blue used for link hovers, card border glow, tags.
- Cards: light glass feel, subtle shadow, thin gradient border.

## Typography
- Headline: distinctive sans-serif with a tech feel.
- Body: neutral, clean sans-serif for readability.
- Hierarchy: Name > Role > Statement > Links/Tags.

## Motion
- Load: Hero and cards fade-in + slight rise with stagger.
- Hover: cards lift 2–4px, shadow and border glow increase.
- Optional ambient: very subtle, slow background glow drift.
- Timing: 300–600ms, ease-out.

## Content Copy (Draft)
- Name: JimLiu
- Role: Geeker
- Statement (bilingual, playful, short):
  - Example: “做点有趣的东西 / Build curious things.”
- Project descriptions (bilingual, concise):
  - Blog: “思考记录 / Essays & notes.”
  - Tweet Craft: “推文打磨 / Refine posts.”
- Tags (examples):
  - Blog: Blog, Writing
  - Tweet Craft: Craft, Tool
- Placeholder: “More coming / 正在发生”

## Data Model (Minimal JS or Static)
Project item fields:
- title
- description
- tags[]
- url

Social link fields:
- label
- url

This can be hard-coded in HTML or rendered from a small JS array.

## Accessibility
- Contrast ratio >= 4.5:1 for text.
- Focus-visible styles on links and cards.
- External links use rel="noopener".

## Testing / QA
- Visual checks at 1024px and 640px.
- Ensure single-screen layout works without overflow on common laptops.
- Verify keyboard navigation on all links.

## Future Extensions
- Add more projects via data array or additional cards.
- Optional sections: timeline, speaking, or mini case studies.

## Decision Log
- Tech: static HTML/CSS with minimal JS.
- Layout: left hero + right project cards.
- Style: light futuristic with grid and cool accents.
