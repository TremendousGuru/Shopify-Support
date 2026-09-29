import { asc } from "drizzle-orm";
import { db } from "@/db";
import { serviceCategories } from "@/db/schema";

export const DEFAULT_SERVICE_CATEGORIES = [
  { slug: "bug-fixing", name: "Bug Fix", description: "Shopify theme, app, checkout, and storefront defect investigation and repairs.", icon: "Wrench", displayOrder: 1 },
  { slug: "store-operations", name: "Store Operation Verification", description: "Verify Shopify store configuration, checkout readiness, integrations, and operational health.", icon: "CheckCircle2", displayOrder: 2 },
  { slug: "business-schema-markup", name: "Business Schema Markup", description: "Business, organization, product, and local structured data for Shopify stores.", icon: "SearchCheck", displayOrder: 3 },
  { slug: "store-redesign", name: "Store Redesign", description: "Full storefront redesigns, information architecture, and theme upgrades.", icon: "Palette", displayOrder: 4 },
  { slug: "theme-customization", name: "Theme Customization", description: "Shopify theme sections, Liquid changes, styling, and responsive customization.", icon: "Wrench", displayOrder: 5 },
  { slug: "app-integrations", name: "Apps & Integrations", description: "Shopify app setup, custom integrations, and connected commerce tools.", icon: "Blocks", displayOrder: 6 },
  { slug: "seo-conversion", name: "SEO & Conversion Optimization", description: "Technical SEO, storefront usability, and conversion improvements.", icon: "SearchCheck", displayOrder: 7 },
  { slug: "store-migration", name: "Store Migration & Data", description: "Shopify migrations, catalog imports, redirects, and data quality checks.", icon: "ArrowRightLeft", displayOrder: 8 },
  { slug: "ongoing-support", name: "Ongoing Shopify Support", description: "Recurring maintenance, troubleshooting, and storefront improvements.", icon: "LifeBuoy", displayOrder: 9 },
];

// Keep the canonical categories available in existing databases as well as new installs.
export async function getServiceCategories() {
  for (const category of DEFAULT_SERVICE_CATEGORIES) {
    await db.insert(serviceCategories).values(category).onConflictDoUpdate({
      target: serviceCategories.slug,
      set: { name: category.name, description: category.description, icon: category.icon, displayOrder: category.displayOrder },
    });
  }
  return db.select().from(serviceCategories).orderBy(asc(serviceCategories.displayOrder));
}
