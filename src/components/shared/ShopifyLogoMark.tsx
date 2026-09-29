import Image from "next/image";

const SHOPIFY_LOGO_URL =
  "https://cdn.shopify.com/b/shopify-brochure2-assets/cac815e4ee0f383f7b4b5302b5a7a29a.svg";

export function ShopifyLogoMark({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={SHOPIFY_LOGO_URL}
      alt="Shopify logo"
      width={size}
      height={size}
      unoptimized
      className={className || "object-contain"}
      draggable={false}
    />
  );
}
