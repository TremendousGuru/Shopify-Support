import { db } from "./index";
import { serviceCategories, services } from "./schema";

export async function seedDatabase() {
  console.log("Starting Shopify Support database seeding...");

  const existingCategories = await db.select().from(serviceCategories);

  // 1. Seed Service Categories
  const categoriesData = [
    {
      slug: "bug-fixing",
      name: "Bug Fixing",
      description: "Theme, app, checkout, and storefront defect investigation and repairs.",
      icon: "Wrench",
      displayOrder: 1,
    },
    {
      slug: "store-operations",
      name: "Store Operational Verification",
      description: "Verify store configuration, checkout readiness, integrations, and operational health.",
      icon: "CheckCircle2",
      displayOrder: 2,
    },
    {
      slug: "business-schema-markup",
      name: "Business Schema Markup",
      description: "Business, organization, product, and local structured data for Shopify stores.",
      icon: "SearchCheck",
      displayOrder: 3,
    },
    {
      slug: "store-redesign",
      name: "Store Redesign",
      description: "Full storefront redesigns, information architecture, and theme upgrades.",
      icon: "Palette",
      displayOrder: 4,
    },
    {
      slug: "theme-customization",
      name: "Theme Customization",
      description: "Shopify theme sections, Liquid changes, styling, and responsive customization.",
      icon: "Wrench",
      displayOrder: 5,
    },
    {
      slug: "store-transformation",
      name: "Store Transformation",
      description: "Brand-led redesigns, storefront remodeling, and premium theme upgrades for Shopify merchants.",
      icon: "Palette",
      displayOrder: 1,
    },
    {
      slug: "store-optimization",
      name: "Store Optimization",
      description: "Performance tuning, checkout improvements, experience polish, and conversion-focused updates.",
      icon: "Gauge",
      displayOrder: 2,
    },
    {
      slug: "audit-analysis",
      name: "Audit & Analysis",
      description: "Store diagnostics, conversion audits, UX reviews, and technical assessments for growth opportunities.",
      icon: "SearchCheck",
      displayOrder: 3,
    },
    {
      slug: "customer-journey",
      name: "Customer Journey Optimization",
      description: "Improving storefront storytelling, merchandising flow, and funnel performance from first click to checkout.",
      icon: "Compass",
      displayOrder: 4,
    },
    {
      slug: "customer-retention",
      name: "Customer Retention Optimization",
      description: "Post-purchase experiences, retention flows, loyalty programs, and repeat-purchase strategy.",
      icon: "HeartHandshake",
      displayOrder: 5,
    },
    {
      slug: "ecommerce-seo",
      name: "SEO & Schema Strategy",
      description: "Search visibility, schema markup, structured data, and organic growth optimization for Shopify stores.",
      icon: "TrendingUp",
      displayOrder: 6,
    },
    {
      slug: "conversion-cro",
      name: "Conversion Optimization",
      description: "CRO experiments, product page improvements, trust-building UX, and high-converting merchandising structure.",
      icon: "Zap",
      displayOrder: 7,
    },
    {
      slug: "store-management",
      name: "Technical Store Support",
      description: "Bug fixing, theme debugging, app troubleshooting, flow repairs, and ongoing Shopify maintenance.",
      icon: "Wrench",
      displayOrder: 8,
    },
    {
      slug: "ecommerce-strategy",
      name: "Growth & Compliance",
      description: "Strategic growth planning, Shopify compliance, platform policy checks, and operational guidance.",
      icon: "Target",
      displayOrder: 9,
    },
  ];

  const existingSlugs = new Set(existingCategories.map((category) => category.slug));
  const missingCategories = categoriesData.filter((category) => !existingSlugs.has(category.slug));
  const insertedCategories = missingCategories.length
    ? await db.insert(serviceCategories).values(missingCategories).returning()
    : [];
  const categoryMap = new Map([...existingCategories, ...insertedCategories].map((category) => [category.slug, category.id]));

  // 2. Seed Services Catalog (All prompt services)
  const servicesList = [
    // Category A: Store Transformation
    {
      categorySlug: "store-transformation",
      slug: "store-design-transformation",
      name: "Store Design Transformation",
      shortDescription: "End-to-end visual overhaul elevating your Shopify store into an iconic high-converting brand.",
      fullDescription: "A comprehensive brand and UI revamp across every touchpoint: bespoke typography, color harmony, lifestyle merchandising, and modern layout design.",
      startingPrice: 1850,
      estimatedDays: "10-14 days",
      features: JSON.stringify(["Custom brand typography & color palette", "Bespoke hero & lifestyle storytelling blocks", "High-conversion modular sections", "Full responsive mobile fidelity check"]),
      displayOrder: 1,
    },
    {
      categorySlug: "store-transformation",
      slug: "shopify-store-redesign",
      name: "Shopify Store Redesign",
      shortDescription: "Complete Shopify theme migration or full architectural redesign tailored for scalability.",
      fullDescription: "Modernize your existing Shopify storefront with clean Dawn/Liquid 2.0 blocks, streamlined navigation, and bespoke page templates.",
      startingPrice: 2200,
      estimatedDays: "14-21 days",
      features: JSON.stringify(["Online Store 2.0 architecture", "Dawn-based custom sections", "Zero bloat lightweight code", "Seamless product catalogue migration"]),
      displayOrder: 2,
    },
    {
      categorySlug: "store-transformation",
      slug: "store-remodeling",
      name: "Store Remodeling",
      shortDescription: "Refresh your storefront layout, product storytelling, and merchandising flow to match your updated brand direction.",
      fullDescription: "Rebuild underperforming storefront sections, modernize navigation, and reshape your shopping experience for improved clarity and conversion.",
      startingPrice: 1600,
      estimatedDays: "7-12 days",
      features: JSON.stringify(["Homepage and collection refresh", "Navigation restructuring", "Brand alignment updates", "Mobile-first redesign QA"]),
      displayOrder: 3,
    },
    {
      categorySlug: "store-transformation",
      slug: "product-page-transformation",
      name: "Product Page Transformation",
      shortDescription: "High-converting PDPs with interactive variant selectors, sticky add-to-cart, and benefit accordions.",
      fullDescription: "Upgrade your Product Detail Pages with persuasive media galleries, sticky purchase bars, reassurance badges, and tabbed specifications.",
      startingPrice: 950,
      estimatedDays: "5-7 days",
      features: JSON.stringify(["Sticky mobile Add to Cart", "Dynamic variant & bundle pickers", "Interactive size & spec charts", "Trust badges & shipping calculator"]),
      displayOrder: 4,
    },

    // Category B: Store Optimization
    {
      categorySlug: "store-optimization",
      slug: "page-speed-optimization",
      name: "Page Speed & Core Web Vitals Optimization",
      shortDescription: "Sub-2 second load times, lazy loading, script deduplication, and Google Lighthouse 90+ score.",
      fullDescription: "Eliminate render-blocking JavaScript, optimize Liquid asset rendering, compress WebP media, and boost Core Web Vitals scores.",
      startingPrice: 750,
      estimatedDays: "3-5 days",
      features: JSON.stringify(["Lighthouse score 85-95+ target", "Unused app JS script removal", "Responsive image WebP compression", "Browser caching & asset deferral"]),
      displayOrder: 1,
    },
    {
      categorySlug: "store-optimization",
      slug: "checkout-experience-optimization",
      name: "Checkout Experience Optimization",
      shortDescription: "Frictionless checkout styling, one-click express pays, post-purchase upsells, and trust signals.",
      fullDescription: "Maximize checkout completion rates through streamlined order flows, dynamic payment buttons (Shop Pay, Apple Pay), and secure checkout badges.",
      startingPrice: 900,
      estimatedDays: "4-7 days",
      features: JSON.stringify(["Shopify Checkout Extensibility setup", "Address autocomplete optimization", "Post-purchase 1-click upsell flow", "Exit-intent cart recovery cues"]),
      displayOrder: 2,
    },

    // Category C: Audit & Analysis
    {
      categorySlug: "audit-analysis",
      slug: "complete-store-audit",
      name: "Complete Store Audit & Diagnostics",
      shortDescription: "Deep 50-point inspection of your UX, tech stack, conversion roadblocks, SEO, and checkout funnel.",
      fullDescription: "Get a 25-page annotated video & PDF audit uncovering every friction point holding back your store revenue, with prioritize action steps.",
      startingPrice: 650,
      estimatedDays: "3 days",
      features: JSON.stringify(["50-point heuristic inspection", "Screen recording video teardown", "Prioritized revenue impact matrix", "Developer-ready implementation checklist"]),
      displayOrder: 1,
    },
    {
      categorySlug: "audit-analysis",
      slug: "conversion-audit",
      name: "Conversion Rate (CRO) Audit",
      shortDescription: "Pinpoint where shoppers drop off from bounce to checkout with data-backed solutions.",
      fullDescription: "In-depth funnel analysis identifying high-friction drop-offs on homepage, category filters, and product detail pages.",
      startingPrice: 550,
      estimatedDays: "2-3 days",
      features: JSON.stringify(["Full funnel drop-off analysis", "Mobile vs desktop friction diagnosis", "Cart abandonment assessment", "Quick-win CRO recommendations"]),
      displayOrder: 2,
    },

    // Category F: Ecommerce SEO
    {
      categorySlug: "ecommerce-seo",
      slug: "personalized-brand-schema-tag",
      name: "Personalized Brand Schema Tag",
      shortDescription: "Custom structured data setup that adds richer, brand-specific schema markup for storefront visibility and trust.",
      fullDescription: "Build and deploy custom schema tags and rich content metadata that make your Shopify storefront easier for search engines and discovery tools to understand.",
      startingPrice: 500,
      estimatedDays: "2-4 days",
      features: JSON.stringify(["Custom JSON-LD schema setup", "Brand identity markup", "Rich snippet alignment", "Search visibility improvements"]),
      displayOrder: 1,
    },
    {
      categorySlug: "ecommerce-seo",
      slug: "shopify-seo-overhaul",
      name: "Shopify SEO & Organic Ranking Overhaul",
      shortDescription: "Structured JSON-LD schema, product collection optimization, meta titles, and canonical cleanup.",
      fullDescription: "Rank higher on Google for lucrative commercial search queries. Fix duplicate collection URLs, missing schema, and slow crawl rates.",
      startingPrice: 1200,
      estimatedDays: "7-10 days",
      features: JSON.stringify(["JSON-LD Product, Breadcrumb & Review schema", "Shopify URL structure canonical fixes", "Keyword-targeted collection copy", "Google Search Console indexing check"]),
      displayOrder: 2,
    },

    // Category H: Store Management & Technical Support
    {
      categorySlug: "store-management",
      slug: "shopify-troubleshooting-support",
      name: "Shopify Troubleshooting & Theme Support",
      shortDescription: "Rapid resolution of Liquid bugs, app conflicts, broken layouts, and checkout glitches.",
      fullDescription: "On-demand technical triage by certified Shopify experts to debug broken Liquid templates, conflicting apps, or third-party integrations.",
      startingPrice: 350,
      estimatedDays: "1-2 days",
      features: JSON.stringify(["Dedicated senior Liquid engineer", "Same-day urgent triage available", "Cross-browser regression testing", "Post-fix code documentation"]),
      displayOrder: 1,
    },
    {
      categorySlug: "store-management",
      slug: "bug-fixing",
      name: "Bug Fixing",
      shortDescription: "Fast resolution of theme bugs, checkout interruptions, broken apps, and store logic errors affecting conversion.",
      fullDescription: "Identify and repair Shopify storefront bugs, JavaScript issues, logic problems, and app conflicts that impact merchant operations and customer experience.",
      startingPrice: 425,
      estimatedDays: "1-4 days",
      features: JSON.stringify(["Bug triage and root cause analysis", "Live issue resolution", "Regression validation", "Priority support queue"]),
      displayOrder: 2,
    },

    // Category I: Growth & Compliance
    {
      categorySlug: "ecommerce-strategy",
      slug: "shopify-compliance-audit",
      name: "Shopify Compliance Audit",
      shortDescription: "Review your merchant setup against Shopify policy, privacy, and operational compliance expectations.",
      fullDescription: "Assess store compliance risks including policy gaps, consent flows, checkout exposure, and operational discipline required for modern commerce operations.",
      startingPrice: 600,
      estimatedDays: "3-6 days",
      features: JSON.stringify(["Policy and process review", "Consent & privacy alignment", "Storefront compliance checklist", "Implementation guidance"]),
      displayOrder: 1,
    },
    {
      categorySlug: "ecommerce-strategy",
      slug: "strategic-growth-planning",
      name: "Strategic Growth Planning",
      shortDescription: "Build a practical roadmap for improving revenue, margin, brand clarity, and campaign efficiency.",
      fullDescription: "Create an actionable ecommerce strategy across content, merchandising, conversion, retention, and operational priorities for your Shopify store.",
      startingPrice: 900,
      estimatedDays: "5-7 days",
      features: JSON.stringify(["Growth roadmap creation", "Pricing and funnel recommendations", "Offer positioning review", "Prioritized plan of action"]),
      displayOrder: 2,
    },
    {
      categorySlug: "store-operations",
      slug: "shopify-store-operational-verification",
      name: "Store Operational Verification",
      shortDescription: "Verify storefront, checkout, shipping, payment, and key integrations before launch or after major changes.",
      fullDescription: "A structured verification of core Shopify store operations, including test orders, checkout configuration, shipping rules, payment methods, and critical app integrations.",
      startingPrice: 450,
      estimatedDays: "2-3 days",
      features: JSON.stringify(["Checkout and test-order review", "Shipping and tax configuration checks", "Payment and app integration verification", "Prioritized findings report"]),
      displayOrder: 1,
    },
    {
      categorySlug: "theme-customization",
      slug: "shopify-theme-customization",
      name: "Shopify Theme Customization",
      shortDescription: "Implement tailored storefront sections, layouts, and responsive styling in your Shopify theme.",
      fullDescription: "Customize an existing Shopify theme with reusable sections and Liquid changes while preserving responsive behavior and current store content.",
      startingPrice: 650,
      estimatedDays: "3-7 days",
      features: JSON.stringify(["Custom Liquid sections", "Responsive styling", "Theme editor settings", "Cross-device QA"]),
      displayOrder: 1,
    },
    {
      categorySlug: "business-schema-markup",
      slug: "shopify-business-schema-markup",
      name: "Business Schema Markup",
      shortDescription: "Add and validate structured business data for search engine understanding and eligible rich results.",
      fullDescription: "Review existing structured data and implement appropriate organization, local business, product, and breadcrumb schema without duplicating theme or app markup.",
      startingPrice: 500,
      estimatedDays: "2-4 days",
      features: JSON.stringify(["Structured data audit", "Business and organization markup", "Duplicate schema checks", "Validation report"]),
      displayOrder: 1,
    },
    {
      categorySlug: "store-redesign",
      slug: "shopify-store-redesign-project",
      name: "Shopify Store Redesign",
      shortDescription: "Reshape your storefront structure and visual system around your brand and customer journey.",
      fullDescription: "Plan and implement a Shopify redesign covering storefront hierarchy, key templates, brand styling, and responsive quality checks.",
      startingPrice: 1850,
      estimatedDays: "10-14 days",
      features: JSON.stringify(["Storefront structure planning", "Theme layout redesign", "Responsive QA", "Launch handoff"]),
      displayOrder: 1,
    },
    {
      categorySlug: "bug-fixing",
      slug: "shopify-bug-fix-service",
      name: "Shopify Bug Fixing",
      shortDescription: "Investigate and resolve storefront, theme, app, and checkout defects affecting store operations.",
      fullDescription: "Reproduce reported defects, identify their root cause, implement a focused fix, and verify that the affected store flow works as expected.",
      startingPrice: 350,
      estimatedDays: "1-3 days",
      features: JSON.stringify(["Issue reproduction and triage", "Theme or app troubleshooting", "Focused repair", "Regression check"]),
      displayOrder: 1,
    },
  ];

  const existingServices = await db.select({ slug: services.slug }).from(services);
  const existingServiceSlugs = new Set(existingServices.map((service) => service.slug));
  for (const s of servicesList) {
    const catId = categoryMap.get(s.categorySlug);
    if (catId && !existingServiceSlugs.has(s.slug)) {
      await db.insert(services).values({
        categoryId: catId,
        slug: s.slug,
        name: s.name,
        shortDescription: s.shortDescription,
        fullDescription: s.fullDescription,
        startingPrice: s.startingPrice,
        estimatedDays: s.estimatedDays,
        features: s.features,
        displayOrder: s.displayOrder,
      });
    }
  }

  console.log("Service catalog seeded. No sample accounts or records were created.");
}

// Allow direct execution
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}
