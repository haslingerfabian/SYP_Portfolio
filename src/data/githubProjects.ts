export type Project = {
  title: string;
  description: string;
  image?: string;
  technologies: string[];
  code: string;
  isCollab: boolean;
};

const STATIC_PROJECTS: Project[] = [
  {
    title: "SYP4_MBOT_G1",
    description: "Robotik-Projekt mit MBot im Team.",
    image: "/img-projects/SYP4_MBOT_G1.jpg",
    technologies: ["C#", "Robotik"],
    code: "https://github.com/jonasaberger/SYP4_MBOT_G1",
    isCollab: true,
  },
  {
    title: "EscapeThe2DBackrooms",
    description:
      "2D-Dungeon Game in Unity. Vorlage für das Design sind die Backrooms. Hier geht es zum Spiel: https://et3rnityraiden.itch.io/escape-the-2d-backrooms",
    image: "/img-projects/EscapeThe2DBackrooms.jpg",
    technologies: ["C#", "Unity"],
    code: "https://github.com/haslingerfabian/EscapeThe2DBackrooms",
    isCollab: false,
  },
];

const STATIC_TITLES = new Set(STATIC_PROJECTS.map((p) => p.title));

async function fetchLanguages(
  languagesUrl: string,
  headers: Record<string, string>
): Promise<string[]> {
  try {
    const res = await fetch(languagesUrl, { headers });
    if (!res.ok) return [];
    const langs = await res.json();
    return Object.keys(langs).slice(0, 3);
  } catch {
    return [];
  }
}

function shortenDescription(text: string | null | undefined, max = 250): string {
  const raw = text ?? "No description provided.";
  return raw.length > max ? raw.substring(0, max - 3) + "..." : raw;
}

export async function fetchGitHubProjects(): Promise<Project[]> {
  const username = "haslingerfabian";
  const token = import.meta.env.GITHUB_TOKEN;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=100&type=owner&sort=updated`,
      { headers }
    );

    if (!res.ok) {
      const normalizedStatic = STATIC_PROJECTS.map((p) => ({
        ...p,
        description: shortenDescription(p.description),
      }));
      return normalizedStatic;
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      const normalizedStatic = STATIC_PROJECTS.map((p) => ({
        ...p,
        description: shortenDescription(p.description),
      }));
      return normalizedStatic;
    }

    const githubProjects: Project[] = [];

    for (const repo of data) {
      if (repo.private) continue;
      if (repo.fork) continue;
      if (STATIC_TITLES.has(repo.name)) continue;

      const technologies = await fetchLanguages(
        repo.languages_url,
        headers
      );

      if (!technologies.length && repo.language) {
        technologies.push(repo.language);
      }

      const image = `/img-projects/${repo.name}.jpg`;
      const description = shortenDescription(repo.description);

      githubProjects.push({
        title: repo.name,
        description,
        image,
        technologies,
        code: repo.html_url,
        isCollab: false,
      });
    }

    const normalizedStatic = STATIC_PROJECTS.map((p) => ({
      ...p,
      description: shortenDescription(p.description),
    }));

    return [...githubProjects, ...normalizedStatic];
  } catch {
    const normalizedStatic = STATIC_PROJECTS.map((p) => ({
      ...p,
      description: shortenDescription(p.description),
    }));
    return normalizedStatic;
  }
}
