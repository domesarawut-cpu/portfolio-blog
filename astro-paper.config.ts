import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://portfolio.domesosara.com",
    title: "Sarawut Srichana - IT Portfolio",
    description: "Portfolio technique spécialisé en infrastructure Azure (IaaS), automatisation et administration système.",
    author: "Sarawut Srichana",
    profile: "https://www.linkedin.com/in/sarawut-srichana-b2791b265/",
    ogImage: "default-og.jpg",
    lang: "en",
    timezone: "America/Toronto",
    dir: "ltr",
  },
  posts: {
    perPage: 4,
    perIndex: 4,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: false,
      url: "https://github.com/domesarawut-cpu/portfolio-blog/edit/main/",
    },
    search: "pagefind",
  },
  socials: [
    { name: "github",   url: "https://github.com/domesarawut-cpu" },
    { name: "linkedin", url: "https://www.linkedin.com/in/sarawut-srichana-b2791b265" },
  ],
  shareLinks: [
    { name: "whatsapp", url: "https://wa.me/?text=" },
    { name: "facebook", url: "https://www.facebook.com/sharer.php?u=" },
    { name: "x",        url: "https://x.com/intent/post?url=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "pinterest", url: "https://pinterest.com/pin/create/button/?url=" },
    { name: "mail",     url: "mailto:?subject=See%20this%20post&body=" },
  ],
});
