export type SocialPlatform = "linkedin" | "instagram" | "facebook" | "whatsapp";

export type FooterSocialLink = {
  id: SocialPlatform;
  label: string;
  href: string;
};

const DEFAULT_LINKEDIN = "https://www.linkedin.com/in/edfaruq/";
const DEFAULT_INSTAGRAM = "https://www.instagram.com/alfaruq_";
const DEFAULT_FACEBOOK = "https://www.facebook.com/telagaciptaindonesia/";
const DEFAULT_WHATSAPP = "https://wa.me/622112345678";

/** Footer social URLs — override via NEXT_PUBLIC_SOCIAL_* in .env.local */
export function getFooterSocialLinks(): FooterSocialLink[] {
  return [
    {
      id: "linkedin",
      label: "LinkedIn",
      href: (process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN ?? DEFAULT_LINKEDIN).trim() || DEFAULT_LINKEDIN,
    },
    {
      id: "instagram",
      label: "Instagram",
      href: (process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM ?? DEFAULT_INSTAGRAM).trim() || DEFAULT_INSTAGRAM,
    },
    {
      id: "facebook",
      label: "Facebook",
      href: (process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK ?? DEFAULT_FACEBOOK).trim() || DEFAULT_FACEBOOK,
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      href: (process.env.NEXT_PUBLIC_SOCIAL_WHATSAPP ?? DEFAULT_WHATSAPP).trim(),
    },
  ];
}
