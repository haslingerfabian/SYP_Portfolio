// =============================
// Types
// =============================

export type Project = {
  title: string;
  description: string;
  image?: string;
  technologies: string[];
  code: string;
  isCollab: boolean;
};

// =============================
// Manuelle Collab-Projekte
// =============================

const COLLAB_PROJECTS: Project[] = [
  {
    title: "SYP4_MBOT_G1",
    description: "Robotik-Projekt mit MBot im Team.",
    image: "/img-projects/SYP4_MBOT_G1.jpg",
    technologies: ["C#", "Robotik"],
    code: "https://github.com/jonasaberger/SYP4_MBOT_G1",
    isCollab: true,
  },
];

const COLLAB_TITLES = new Set(COLLAB_PROJECTS.map((p) => p.title));

// =============================
// Helper: Sprache(n) eines Repos holen
// =============================

async function fetchLanguages(
  repoUrl: string,
  headers: Record<string, string>
): Promise<string[]> {
  try {
    const res = await fetch(`${repoUrl}/languages`, { headers });
    if (!res.ok) return [];
    const langs = await res.json();
    return Object.keys(langs).slice(0, 3); // Max. 3 Technologien
  } catch {
    return [];
  }
}

// =============================
// Helper: Description kürzen
// =============================

function shortenDescription(text: string | null, max = 140): string {
  const raw = text ?? "No description provided.";
  return raw.length > max ? raw.substring(0, max - 3) + "..." : raw;
}

// =============================
// Hauptfunktion: GitHub Projekte laden
// =============================

export async function fetchGitHubProjects(): Promise<Project[]> {
  const username = import.meta.env.GITHUB_USERNAME;
  const token = import.meta.env.GITHUB_TOKEN;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const projects: Project[] = [];
  const perPage = 100;
  let page = 1;

  // ========= GitHub-Repos laden ==========
  while (true) {
    const res = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=${perPage}&page=${page}&type=owner&sort=updated`,
      { headers }
    );

    if (!res.ok) break;

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;

    for (const repo of data) {
      if (repo.private) continue;
      if (COLLAB_TITLES.has(repo.name)) continue; // collab wird separat behandelt

      // Technologien
      const technologies = await fetchLanguages(repo.url, headers);
      if (!technologies.length && repo.language) {
        technologies.push(repo.language);
      }

      // Bildpfad (muss im public/img-projects/ vorhanden sein)
      const image = `/img-projects/${repo.name}.jpg`;

      // Beschreibung kürzen
      const description = shortenDescription(repo.description);

      projects.push({
        title: repo.name,
        description,
        image,
        technologies,
        code: repo.html_url,
        isCollab: false,
      });
    }

    if (data.length < perPage) break;
    page++;
    if (page > 5) break; // Hardlimit
  }

  // ========= Collab-Projekte hinzufügen ==========
  for (const c of COLLAB_PROJECTS) {
    projects.push({
      ...c,
      description: shortenDescription(c.description),
      isCollab: true,
    });
  }

  return projects;
}
