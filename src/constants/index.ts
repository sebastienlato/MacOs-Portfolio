import type {
  Accent,
  BlogPost,
  DockApp,
  FinderItem,
  FocusMode,
  IconStyle,
  SoundOutput,
  Social,
  TechStackEntry,
  Wallpaper,
  WindowKey,
  WindowState,
} from "#types";

interface NavLink {
  id: number;
  name: string;
  type: WindowKey;
}

interface NavIcon {
  id: number;
  img: string;
  action?: "spotlight" | "wifi";
}

interface PhotosLink {
  id: number;
  icon: string;
  title: string;
}

interface GalleryImage {
  id: number;
  img: string;
}

interface AboutSpec {
  label: string;
  value: string;
}

const navLinks: NavLink[] = [
  {
    id: 1,
    name: "Projects",
    type: "finder",
  },
  {
    id: 3,
    name: "Contact",
    type: "contact",
  },
  {
    id: 4,
    name: "Resume",
    type: "resume",
  },
];

const navIcons: NavIcon[] = [
  {
    id: 1,
    img: "/icons/wifi.svg",
    action: "wifi",
  },
  {
    id: 2,
    img: "/icons/search.svg",
    action: "spotlight",
  },
  {
    id: 3,
    img: "/icons/user.svg",
  },
];

const wallpapers: Wallpaper[] = [
  {
    /*
     * Lake at dusk, which is what 26 ships: deep water at the top of the
     * screen opening into cyan at the shoreline.
     *
     * The first stop has to be the one the menu bar sits over, because that is
     * the end `wallpaperNeedsDarkText` samples — it reads the first hex in this
     * string and nothing else. Dark there, so the bar keeps its white glyphs.
     */
    id: "tahoe",
    name: "Tahoe",
    type: "gradient",
    value:
      "linear-gradient(168deg, #0a1f3d 0%, #123a63 26%, #1b5b86 50%, #2a7f9b 74%, #4aa6a8 100%)",
  },
  {
    id: "sequoia",
    name: "Sequoia",
    type: "image",
    value: "/images/wallpaper.webp",
    /* 2880px of wallpaper on a 390px screen, at five times the weight. Made
       with: sharp(value).resize({ width: 1440 }).webp({ quality: 82 }) */
    mobileValue: "/images/wallpaper-mobile.webp",
  },
  {
    id: "sonoma",
    name: "Sonoma",
    type: "gradient",
    value: "linear-gradient(160deg, #f8b500 0%, #e96443 45%, #904e95 100%)",
  },
  {
    id: "ventura",
    name: "Ventura",
    type: "gradient",
    value: "linear-gradient(140deg, #ff512f 0%, #dd2476 55%, #5f2c82 100%)",
  },
  {
    id: "monterey",
    name: "Monterey",
    type: "gradient",
    value: "linear-gradient(135deg, #12c2e9 0%, #c471ed 50%, #f64f59 100%)",
  },
  {
    id: "bigsur",
    name: "Big Sur",
    type: "gradient",
    value: "linear-gradient(170deg, #0f2027 0%, #203a43 45%, #2c5364 100%)",
  },
  {
    id: "midnight",
    name: "Midnight",
    type: "gradient",
    value: "linear-gradient(180deg, #0b0b1f 0%, #1b1b3a 55%, #34345c 100%)",
  },
];

/**
 * The accent colours macOS offers. Every selection, highlight and focus ring
 * in the app is drawn from whichever one is picked.
 *
 * `on` is the text that sits on top: white everywhere except yellow, where it
 * would be unreadable — Apple ships that contrast, this does not have to.
 */
const accents: Accent[] = [
  { id: "blue", name: "Blue", value: "#0a84ff", on: "#ffffff" },
  { id: "purple", name: "Purple", value: "#a24bd6", on: "#ffffff" },
  { id: "pink", name: "Pink", value: "#f4479b", on: "#ffffff" },
  { id: "red", name: "Red", value: "#ff453a", on: "#ffffff" },
  { id: "orange", name: "Orange", value: "#ff9f0a", on: "#3d2600" },
  { id: "yellow", name: "Yellow", value: "#ffd60a", on: "#3d3000" },
  { id: "green", name: "Green", value: "#30d158", on: "#04310f" },
  { id: "graphite", name: "Graphite", value: "#8e8e93", on: "#ffffff" },
];

const iconStyles: { id: IconStyle; name: string }[] = [
  { id: "default", name: "Default" },
  { id: "dark", name: "Dark" },
  { id: "clear", name: "Clear" },
  { id: "tinted", name: "Tinted" },
];

const dockApps: DockApp[] = [
  {
    id: "finder",
    name: "Portfolio",
    icon: "finder.png",
    canOpen: true,
  },
  {
    id: "safari",
    name: "Articles",
    icon: "safari.png",
    canOpen: true,
  },
  {
    id: "photos",
    name: "Gallery",
    icon: "photos.png",
    canOpen: true,
  },
  {
    id: "contact",
    name: "Contact",
    icon: "contact.png",
    canOpen: true,
  },
  {
    id: "terminal",
    name: "Terminal",
    icon: "terminal.png",
    canOpen: true,
  },
  {
    id: "trash",
    name: "Trash",
    icon: "trash.webp",
    canOpen: true,
    // The dock's one divider: apps on the left, files and Trash on the right
    separatorBefore: true,
  },
];

const blogPosts: BlogPost[] = [
  {
    id: 1,
    date: "Nov 24, 2025",
    title: "How I Structure All My Xcode Projects",
    image: "/images/blog1.webp",
    link: "https://dev.to/sebastienlato/how-i-structure-all-my-xcode-projects-19ic",
  },
  {
    id: 2,
    date: "Nov 24, 2025",
    title: "How to Build a Clean Collapsible Header in SwiftUI",
    image: "/images/blog2.webp",
    link: "https://dev.to/sebastienlato/how-to-build-a-clean-collapsible-header-in-swiftui-7hn",
  },
  {
    id: 3,
    date: "Nov 24, 2025",
    title: "How to Build a Floating Bottom Sheet in SwiftUI (Drag, Snap, Blur)",
    image: "/images/blog3.webp",
    link: "https://dev.to/sebastienlato/how-to-build-a-floating-bottom-sheet-in-swiftui-drag-snap-blur-lfp",
  },
];

const techStack: TechStackEntry[] = [
  {
    category: "Frontend",
    items: ["React.js", "Next.js", "TypeScript"],
  },
  {
    category: "Mobile",
    items: ["React Native", "Expo", "Swift", "SwiftUI"],
  },
  {
    category: "Styling",
    items: ["Tailwind CSS", "Sass", "CSS"],
  },
  {
    category: "Backend",
    items: ["Node.js", "Express", "NestJS", "Hono"],
  },
  {
    category: "Database",
    items: ["MongoDB", "PostgreSQL"],
  },
  {
    category: "Dev Tools",
    items: ["Git", "GitHub", "Docker"],
  },
];

const socials: Social[] = [
  {
    id: 1,
    text: "Github",
    icon: "/icons/github.svg",
    bg: "#f4656b",
    link: "https://github.com/sebastienlato",
  },
  {
    id: 2,
    text: "Platform",
    icon: "/icons/atom.svg",
    bg: "#4bcb63",
    link: "https://sebastienlato.com/",
  },
  {
    id: 3,
    text: "Twitter/X",
    icon: "/icons/twitter.svg",
    bg: "#ff866b",
    link: "https://x.com/SebastienLato/",
  },
  {
    id: 4,
    text: "LinkedIn",
    icon: "/icons/linkedin.svg",
    bg: "#05b6f6",
    link: "https://www.linkedin.com/in/sebastien-lato-585535377/",
  },
];

const photosLinks: PhotosLink[] = [
  {
    id: 1,
    icon: "/icons/gicon1.svg",
    title: "Library",
  },
  {
    id: 2,
    icon: "/icons/gicon2.svg",
    title: "Memories",
  },
  {
    id: 3,
    icon: "/icons/file.svg",
    title: "Places",
  },
  {
    id: 4,
    icon: "/icons/gicon4.svg",
    title: "People",
  },
  {
    id: 5,
    icon: "/icons/gicon5.svg",
    title: "Favorites",
  },
];

const gallery: GalleryImage[] = [
  {
    id: 1,
    img: "/images/gal1.webp",
  },
  {
    id: 2,
    img: "/images/gal2.webp",
  },
  {
    id: 3,
    img: "/images/gal3.webp",
  },
  {
    id: 4,
    img: "/images/gal4.webp",
  },
];

const aboutSpecs: AboutSpec[] = [
  { label: "Chip", value: "React 19 (8-core Hooks)" },
  { label: "Memory", value: "Zustand + Immer, unified" },
  { label: "Graphics", value: "GSAP 3 with Draggable" },
  { label: "Styling", value: "Tailwind CSS v4" },
  { label: "Serial Number", value: "SL-PORTFOLIO-2026" },
];

/**
 * The address the Contact window prints and Spotlight's actions write to the
 * clipboard. One copy, so the two can never disagree about where mail goes.
 */
const contactEmail = "contact@latodev.pro";

/**
 * The Focuses Control Center offers. Apple's own defaults, minus the ones that
 * only mean anything with a calendar or a car attached.
 */
const focusModes: FocusMode[] = [
  { id: "dnd", name: "Do Not Disturb", icon: "moon" },
  { id: "work", name: "Work", icon: "briefcase" },
  { id: "personal", name: "Personal", icon: "user" },
  { id: "sleep", name: "Sleep", icon: "bed" },
];

/** Where sound goes. Named after this Mac, which is the one in About This Mac. */
const soundOutputs: SoundOutput[] = [
  { id: "internal", name: "MacBook Pro Speakers", kind: "speakers" },
  { id: "airpods", name: "Sebastien's AirPods Pro", kind: "headphones" },
  { id: "display", name: "Studio Display", kind: "airplay" },
];

export {
  contactEmail,
  focusModes,
  soundOutputs,
  navLinks,
  navIcons,
  dockApps,
  wallpapers,
  accents,
  iconStyles,
  aboutSpecs,
  blogPosts,
  techStack,
  socials,
  photosLinks,
  gallery,
};

const WORK_LOCATION: FinderItem = {
  id: 1,
  type: "work",
  name: "Work",
  icon: "/icons/work.svg",
  kind: "folder",
  children: [
    // ▶ Project 1
    {
      id: 5,
      name: "SecureVault",
      icon: "/images/folder.png",
      kind: "folder",
      folderColor: "graphite",
      folderBadge: "lock",
      children: [
        {
          id: 1,
          name: "SecureVault Project.txt",
          icon: "/images/txt.png",
          kind: "file",
          fileType: "txt",
          description: [
            "SecureVault is a SwiftUI password manager purpose-built for iOS. It keeps every credential encrypted on-device,",
            "unlocks with biometrics, and presents a thoughtfully designed UI for organising, auditing, and sharing passwords.",
            "It's built with SwiftUI, Swift, and Combine, ensuring fast performance, responsive design, and a clean, premium look.",
          ],
        },
        {
          id: 2,
          name: "securevault.com",
          icon: "/images/safari.png",
          kind: "file",
          fileType: "url",
          href: "https://github.com/sebastienlato/SecureVault",
        },
        {
          id: 4,
          name: "securevault.png",
          icon: "/images/image.png",
          kind: "file",
          fileType: "img",
          imageUrl: "/images/project-1.webp",
        },
      ],
    },

    // ▶ Project 2
    {
      id: 6,
      name: "PetSitterQR",
      icon: "/images/folder.png",
      kind: "folder",
      folderColor: "orange",
      folderBadge: "paw",
      children: [
        {
          id: 1,
          name: "PetSitterQR Project.txt",
          icon: "/images/txt.png",
          kind: "file",
          fileType: "txt",
          description: [
            "PetSitterQR is a SwiftUI app for creating and sharing pet care cards via QR codes.",
            "Owners can manage pets locally with optional photos and generate text-only QR codes.",
            "Sitters can scan these codes to instantly view or import care details onto their device.",
            "The app includes GlassCard UI, detailed care sections, and secure on-device photo storage.",
            "Built with SwiftData, it offers a clean structure across features, services, models, and design system.",
          ],
        },
        {
          id: 2,
          name: "petsitterqr.com",
          icon: "/images/safari.png",
          kind: "file",
          fileType: "url",
          href: "https://github.com/sebastienlato/PetSitterQR",
        },
        {
          id: 4,
          name: "petsitterqr.png",
          icon: "/images/image.png",
          kind: "file",
          fileType: "img",
          imageUrl: "/images/project-2.webp",
        },
      ],
    },

    // ▶ Project 3
    {
      id: 7,
      name: "SleepSoundsApp",
      icon: "/images/folder.png",
      kind: "folder",
      folderColor: "purple",
      folderBadge: "moon",
      children: [
        {
          id: 1,
          name: "Sleep Sounds App Project.txt",
          icon: "/images/txt.png",
          kind: "file",
          fileType: "txt",
          description: [
            "Sleep Sounds App lets you stack calming ambient loops like rain, ocean waves, and fireplace crackles.",
            "Each sound has one-tap play/pause, animated volume controls, and its own accent color + SF Symbol.",
            "A built-in sleep timer offers presets, wheel pickers, and a live countdown that fades audio out automatically.",
            "Behind the scenes, lightweight SwiftUI services manage looping audio, volumes, haptics, and session interruptions.",
            "The project is built entirely in SwiftUI, organized into Features/Services folders for a clean, scalable architecture.",
          ],
        },
        {
          id: 2,
          name: "sleepsoundsapp.com",
          icon: "/images/safari.png",
          kind: "file",
          fileType: "url",
          href: "https://github.com/sebastienlato/SleepSoundsApp",
        },
        {
          id: 4,
          name: "sleepsoundsapp.png",
          icon: "/images/image.png",
          kind: "file",
          fileType: "img",
          imageUrl: "/images/project-3.webp",
        },
      ],
    },
  ],
};

const ABOUT_LOCATION: FinderItem = {
  id: 2,
  type: "about",
  name: "About me",
  icon: "/icons/info.svg",
  kind: "folder",
  children: [
    {
      id: 1,
      name: "me.png",
      icon: "/images/image.png",
      kind: "file",
      fileType: "img",
      imageUrl: "/images/sebastien.webp",
    },
    {
      id: 2,
      name: "casual-me.png",
      icon: "/images/image.png",
      kind: "file",
      fileType: "img",
      imageUrl: "/images/sebastien-2.webp",
    },
    {
      id: 3,
      name: "conference-me.png",
      icon: "/images/image.png",
      kind: "file",
      fileType: "img",
      imageUrl: "/images/sebastien-3.webp",
    },
    {
      id: 4,
      name: "about-me.txt",
      icon: "/images/txt.png",
      kind: "file",
      fileType: "txt",
      subtitle: "Meet the Developer Behind the Code",
      image: "/images/sebastien.webp",
      description: [
        "Hey! I’m Sebastien 👋, a mobile and web developer who enjoys building sleek, interactive apps and websites that actually work well.",
        "I specialize in Swift, SwiftUI, JavaScript, React, and Next.js—and I love making things feel smooth, fast, and just a little bit delightful.",
        "I’m big on clean UI, good UX, and writing code that doesn’t need a search party to debug.",
        "Outside of dev work, you'll find me tweaking layouts at 2AM, sipping overpriced coffee, or impulse-buying gadgets I absolutely convinced myself I needed 😅",
      ],
    },
  ],
};

const RESUME_LOCATION: FinderItem = {
  id: 3,
  type: "resume",
  name: "Resume",
  icon: "/icons/file.svg",
  kind: "folder",
  children: [
    {
      id: 1,
      name: "Resume.pdf",
      icon: "/images/pdf.png",
      kind: "file",
      fileType: "pdf",
    },
  ],
};

const TRASH_LOCATION: FinderItem = {
  id: 4,
  type: "trash",
  name: "Trash",
  icon: "/icons/trash.svg",
  kind: "folder",
  children: [
    {
      id: 1,
      name: "trash1.png",
      icon: "/images/image.png",
      kind: "file",
      fileType: "img",
      imageUrl: "/images/trash-1.webp",
    },
    {
      id: 2,
      name: "trash2.png",
      icon: "/images/image.png",
      kind: "file",
      fileType: "img",
      imageUrl: "/images/trash-2.webp",
    },
  ],
};

export const locations: Record<string, FinderItem> = {
  work: WORK_LOCATION,
  about: ABOUT_LOCATION,
  resume: RESUME_LOCATION,
  trash: TRASH_LOCATION,
};

const INITIAL_Z_INDEX = 1000;

const WINDOW_DEFAULTS: WindowState = {
  isOpen: false,
  isMinimized: false,
  tile: null,
  hasOpened: false,
  zIndex: INITIAL_Z_INDEX,
  data: null,
};

const WINDOW_CONFIG: Record<WindowKey, WindowState> = {
  finder: { ...WINDOW_DEFAULTS },
  contact: { ...WINDOW_DEFAULTS },
  resume: { ...WINDOW_DEFAULTS },
  safari: { ...WINDOW_DEFAULTS },
  photos: { ...WINDOW_DEFAULTS },
  terminal: { ...WINDOW_DEFAULTS },
  txtfile: { ...WINDOW_DEFAULTS },
  imgfile: { ...WINDOW_DEFAULTS },
  settings: { ...WINDOW_DEFAULTS },
  about: { ...WINDOW_DEFAULTS },
};

/**
 * Everything that is a window or system chrome — i.e. everything that is *not*
 * the bare desktop. A right-click inside any of it should
 * be left alone. Windows are derived from the config so a new one is covered
 * the moment it is registered.
 */
const NON_DESKTOP_SELECTOR = [
  "nav",
  "#dock",
  "#welcome",
  "#spotlight",
  "#control-center",
  "#notification-center",
  ".mission-control",
  ".context-menu",
  ...Object.keys(WINDOW_CONFIG).map((key) => `#${key}`),
].join(", ");

export { INITIAL_Z_INDEX, WINDOW_CONFIG, NON_DESKTOP_SELECTOR };
