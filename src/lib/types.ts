// Structure de src/data/content.json — partagée par le site et le back-office.

export type Photo = { src: string; thumb: string; w: number; h: number; alt?: string };

export type Social = { label: string; url: string };

export type Video = {
  title: string;
  subtitle: string;
  credit: string;
  year: string;
  youtube: string;
  link: string;
};

export type VideoCategory = { category: string; items: Video[] };

export type Gallery = {
  slug: string;
  title: string;
  context: string;
  place: string;
  year: string;
  related: string;
  photos: Photo[];
};

export type Section = { title: string; caption: string; photos: Photo[] };

export type Creation = {
  slug: string;
  title: string;
  org: string;
  year: string;
  work: string;
  text: string;
  sections: Section[];
  video: { title: string; credit: string; youtube: string };
};

export type Project = {
  slug: string;
  title: string;
  kicker: string;
  date: string;
  place: string;
  intro: string;
  youtube: string;
  cover: Photo | null;
  sections: Section[];
  moreLabel: string;
  moreLink: string;
};

export type Content = {
  settings: {
    name: string;
    role: string;
    email: string;
    formspreeId: string;
    socials: Social[];
    theme: { bg: string; text: string; accent: string };
    demoPhotos: boolean;
  };
  home: { tagline: string; heroPhoto: Photo | null; featured: string };
  videos: VideoCategory[];
  galleries: Gallery[];
  creations: Creation[];
  projects: Project[];
};
