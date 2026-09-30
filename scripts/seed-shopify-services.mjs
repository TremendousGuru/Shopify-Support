import "dotenv/config";
import { Client } from "pg";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const categories = [
  { slug: "bug-fixing", name: "Bug Fix", description: "Theme, app, checkout, and storefront defect investigation and repairs.", icon: "Wrench", displayOrder: 1 },
  { slug: "store-operations", name: "Store Operational Verification", description: "Verify store configuration, checkout readiness, integrations, and operational health.", icon: "CheckCircle2", displayOrder: 2 },
  { slug: "business-schema-markup", name: "Business Schema Markup", description: "Business, organization, product, and local structured data for Shopify stores.", icon: "SearchCheck", displayOrder: 3 },
  { slug: "store-redesign", name: "Store Redesign", description: "Full storefront redesigns, information architecture, and theme upgrades.", icon: "Palette", displayOrder: 4 },
  { slug: "theme-customization", name: "Theme Customization", description: "Shopify theme sections, Liquid changes, styling, and responsive customization.", icon: "Wrench", displayOrder: 5 },
  { slug: "app-integrations", name: "Apps & Integrations", description: "Shopify app setup, custom integrations, and connected commerce tools.", icon: "Blocks", displayOrder: 6 },
  { slug: "seo-conversion", name: "SEO & Conversion Optimization", description: "Technical SEO, structured data, storefront usability, and conversion improvements.", icon: "SearchCheck", displayOrder: 7 },
  { slug: "store-migration", name: "Store Migration & Data", description: "Shopify migrations, catalog imports, redirects, and data quality checks.", icon: "ArrowRightLeft", displayOrder: 8 },
  { slug: "ongoing-support", name: "Ongoing Shopify Support", description: "Recurring maintenance, troubleshooting, and incremental storefront improvements.", icon: "LifeBuoy", displayOrder: 9 },
];

const services = [
  { category: "store-operations", slug: "shopify-store-operational-verification", name: "Store Operational Verification", description: "Verify storefront, checkout, shipping, payment, and integrations.", price: 450, days: "2-3 days", features: ["Checkout and test-order review", "Shipping and tax checks", "Payment and app integration verification", "Prioritized findings report"] },
  { category: "business-schema-markup", slug: "shopify-business-schema-markup", name: "Business Schema Markup", description: "Add and validate structured business data for Shopify storefronts.", price: 500, days: "2-4 days", features: ["Structured data audit", "Business and organization markup", "Duplicate schema checks", "Validation report"] },
  { category: "business-schema-markup", slug: "brand-schema-tag-basic", name: "Brand Schema Tag - Basic", description: "Essential organization and brand structured data for your Shopify homepage.", price: 150, days: "Confirmed after store review", features: ["Organization/brand schema markup setup on the homepage", "Logo and brand information structured data", "Google-readable structured data validation"] },
  { category: "business-schema-markup", slug: "brand-schema-tag-standard", name: "Brand Schema Tag - Standard", description: "Product and breadcrumb structured data, with rich snippet testing and validation.", price: 300, days: "Confirmed after store review", features: ["Everything in Basic", "Product schema markup for key products", "Breadcrumb schema setup", "Rich snippet testing and validation"] },
  { category: "business-schema-markup", slug: "brand-schema-tag-premium", name: "Brand Schema Tag - Premium", description: "Full site-wide schema implementation with ongoing monitoring and priority support.", price: 500, days: "Confirmed after store review", features: ["Everything in Standard", "Full site-wide schema implementation (FAQ, Review, LocalBusiness where applicable)", "Ongoing schema monitoring and error fixing", "Priority support"] },
  { category: "store-redesign", slug: "shopify-store-redesign-project", name: "Shopify Store Redesign", description: "Reshape your storefront structure and visual system around your brand.", price: 1850, days: "10-14 days", features: ["Storefront structure planning", "Theme layout redesign", "Responsive QA", "Launch handoff"] },
  { category: "theme-customization", slug: "shopify-theme-customization", name: "Shopify Theme Customization", description: "Implement tailored storefront sections, layouts, and responsive styling.", price: 650, days: "3-7 days", features: ["Custom Liquid sections", "Responsive styling", "Theme editor settings", "Cross-device QA"] },
  { category: "bug-fixing", slug: "shopify-bug-fix-service", name: "Shopify Bug Fixing", description: "Investigate and resolve storefront, theme, app, and checkout defects.", price: 350, days: "1-3 days", features: ["Issue reproduction and triage", "Theme or app troubleshooting", "Focused repair", "Regression check"] },
  { category: "app-integrations", slug: "shopify-app-integrations", name: "Shopify App & Integration Setup", description: "Configure and verify Shopify apps and the connections between store systems.", price: 550, days: "3-5 days", features: ["App compatibility review", "Store integration setup", "Data flow checks", "Handover notes"] },
  { category: "seo-conversion", slug: "shopify-seo-conversion-audit", name: "Shopify SEO & Conversion Audit", description: "Review search fundamentals and storefront friction that can affect conversion.", price: 600, days: "4-6 days", features: ["Technical SEO review", "Structured data checks", "Product page usability review", "Prioritized action plan"] },
  { category: "store-migration", slug: "shopify-store-migration-support", name: "Shopify Store Migration Support", description: "Plan and validate product, customer, URL, and storefront data migration into Shopify.", price: 1200, days: "5-10 days", features: ["Migration planning", "Catalog and data import review", "Redirect checks", "Post-migration validation"] },
  { category: "ongoing-support", slug: "shopify-ongoing-store-support", name: "Ongoing Shopify Store Support", description: "Recurring technical support and small improvements for an active Shopify store.", price: 400, days: "Monthly", features: ["Scheduled support hours", "Issue triage", "Small storefront changes", "Monthly activity summary"] },
];

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query("BEGIN");
  const categoryIds = new Map();
  for (const category of categories) {
    const result = await client.query(
      `INSERT INTO service_categories (slug, name, description, icon, display_order)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, icon = EXCLUDED.icon
       RETURNING id`,
      [category.slug, category.name, category.description, category.icon, category.displayOrder]
    );
    categoryIds.set(category.slug, result.rows[0].id);
  }

  for (const service of services) {
    await client.query(
      `INSERT INTO services (category_id, slug, name, short_description, full_description, starting_price, estimated_days, features, is_active, display_order)
       VALUES ($1, $2, $3, $4, $4, $5, $6, $7, true, 1)
       ON CONFLICT (slug) DO NOTHING`,
      [categoryIds.get(service.category), service.slug, service.name, service.description, service.price, service.days, JSON.stringify(service.features)]
    );
  }
  await client.query("COMMIT");
  console.log(`Ensured ${categories.length} Shopify service categories and ${services.length} catalog offerings.`);
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
