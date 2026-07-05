import type {
  BlogPost,
  DockApp,
  FinderItem,
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
  action?: "spotlight" | "theme" | "wifi";
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
  {
    id: 4,
    img: "/icons/mode.svg",
    action: "theme",
  },
];

const wallpapers: Wallpaper[] = [
  {
    id: "sequoia",
    name: "Sequoia",
    type: "image",
    value: "/images/wallpaper.png",
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
    icon: "trash.png",
    canOpen: true,
  },
];

const blogPosts: BlogPost[] = [
  {
    id: 1,
    date: "Nov 24, 2025",
    title: "How I Structure All My Xcode Projects",
    image: "/images/blog1.png",
    link: "https://dev.to/sebastienlato/how-i-structure-all-my-xcode-projects-19ic",
  },
  {
    id: 2,
    date: "Nov 24, 2025",
    title: "How to Build a Clean Collapsible Header in SwiftUI",
    image: "/images/blog2.png",
    link: "https://dev.to/sebastienlato/how-to-build-a-clean-collapsible-header-in-swiftui-7hn",
  },
  {
    id: 3,
    date: "Nov 24, 2025",
    title: "How to Build a Floating Bottom Sheet in SwiftUI (Drag, Snap, Blur)",
    image: "/images/blog3.png",
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
    img: "/images/gal1.png",
  },
  {
    id: 2,
    img: "/images/gal2.png",
  },
  {
    id: 3,
    img: "/images/gal3.png",
  },
  {
    id: 4,
    img: "/images/gal4.png",
  },
];

const aboutSpecs: AboutSpec[] = [
  { label: "Chip", value: "React 19 (8-core Hooks)" },
  { label: "Memory", value: "Zustand + Immer, unified" },
  { label: "Graphics", value: "GSAP 3 with Draggable" },
  { label: "Styling", value: "Tailwind CSS v4" },
  { label: "Serial Number", value: "SL-PORTFOLIO-2026" },
];

export {
  navLinks,
  navIcons,
  dockApps,
  wallpapers,
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
      position: "top-10 left-5", // icon position inside Finder
      windowPosition: "top-[5vh] left-5", // optional: Finder window position
      children: [
        {
          id: 1,
          name: "SecureVault Project.txt",
          icon: "/images/txt.png",
          kind: "file",
          fileType: "txt",
          position: "top-5 left-10",
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
          position: "top-10 right-20",
        },
        {
          id: 4,
          name: "securevault.png",
          icon: "/images/image.png",
          kind: "file",
          fileType: "img",
          position: "top-52 right-80",
          imageUrl: "/images/project-1.png",
        },
        {
          id: 5,
          name: "Design.fig",
          icon: "/images/plain.png",
          kind: "file",
          fileType: "fig",
          href: "https://google.com",
          position: "top-60 right-20",
        },
      ],
    },

    // ▶ Project 2
    {
      id: 6,
      name: "PetSitterQR",
      icon: "/images/folder.png",
      kind: "folder",
      position: "top-52 right-80",
      windowPosition: "top-[20vh] left-7",
      children: [
        {
          id: 1,
          name: "PetSitterQR Project.txt",
          icon: "/images/txt.png",
          kind: "file",
          fileType: "txt",
          position: "top-5 right-10",
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
          position: "top-20 left-20",
        },
        {
          id: 4,
          name: "petsitterqr.png",
          icon: "/images/image.png",
          kind: "file",
          fileType: "img",
          position: "top-52 left-80",
          imageUrl: "/images/project-2.png",
        },
        {
          id: 5,
          name: "Design.fig",
          icon: "/images/plain.png",
          kind: "file",
          fileType: "fig",
          href: "https://google.com",
          position: "top-60 left-5",
        },
      ],
    },

    // ▶ Project 3
    {
      id: 7,
      name: "SleepSoundsApp",
      icon: "/images/folder.png",
      kind: "folder",
      position: "top-10 left-80",
      windowPosition: "top-[33vh] left-7",
      children: [
        {
          id: 1,
          name: "Sleep Sounds App Project.txt",
          icon: "/images/txt.png",
          kind: "file",
          fileType: "txt",
          position: "top-5 left-10",
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
          position: "top-10 right-20",
        },
        {
          id: 4,
          name: "sleepsoundsapp.png",
          icon: "/images/image.png",
          kind: "file",
          fileType: "img",
          position: "top-52 right-80",
          imageUrl: "/images/project-3.png",
        },
        {
          id: 5,
          name: "Design.fig",
          icon: "/images/plain.png",
          kind: "file",
          fileType: "fig",
          href: "https://google.com",
          position: "top-60 right-20",
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
      position: "top-10 left-5",
      imageUrl: "/images/sebastien.png",
    },
    {
      id: 2,
      name: "casual-me.png",
      icon: "/images/image.png",
      kind: "file",
      fileType: "img",
      position: "top-28 right-72",
      imageUrl: "/images/sebastien-2.png",
    },
    {
      id: 3,
      name: "conference-me.png",
      icon: "/images/image.png",
      kind: "file",
      fileType: "img",
      position: "top-52 left-80",
      imageUrl: "/images/sebastien-3.png",
    },
    {
      id: 4,
      name: "about-me.txt",
      icon: "/images/txt.png",
      kind: "file",
      fileType: "txt",
      position: "top-60 left-5",
      subtitle: "Meet the Developer Behind the Code",
      image: "/images/sebastien.png",
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
      position: "top-10 left-10",
      imageUrl: "/images/trash-1.png",
    },
    {
      id: 2,
      name: "trash2.png",
      icon: "/images/image.png",
      kind: "file",
      fileType: "img",
      position: "top-40 left-80",
      imageUrl: "/images/trash-2.png",
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
  isMaximized: false,
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

export { INITIAL_Z_INDEX, WINDOW_CONFIG };
