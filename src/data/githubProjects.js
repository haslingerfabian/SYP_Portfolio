const COLLAB_PROJECTS = [
  {
    title: "SYP_MBOT_G1",
    description: "Robotik-Projekt mit MBot im Team.",
    image: "/images/projects/SYP_MBOT_G1.png",
    technologies: ["C#", "Robotik"],
    code: "https://github.com/jonasaberger/SYP_MBOT_G1",
    isCollab: true
  },
];

async function fetchLanguages(repoUrl, headers) {
  try {
    const res = await fetch(`${repoUrl}/languages`, { headers });
    if (!res.ok) return [];
    const langs = await res.json();
    return Object.keys(langs).slice(0, 3);
  } catch {
    return [];
  }
}

export async function fetchGitHubProjects() {
  const username = import.meta.env.GITHUB_USERNAME;
  const token = import.meta.env.GITHUB_TOKEN;

  const headers = { Accept: "application/vnd.github+json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const projects = [];
  const perPage = 100;
  let page = 1;

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

      const technologies = await fetchLanguages(repo.url, headers);
      if (!technologies.length && repo.language) {
        technologies.push(repo.language);
      }

      projects.push({
        title: repo.name,
        description: repo.description ?? "No description provided.",
        image: `/images/projects/${repo.name}.png`,
        technologies,
        code: repo.html_url,
      });
    }

    if (data.length < perPage) break;
    page++;
    if (page > 5) break;
  }

  for (const c of COLLAB_PROJECTS) {
    projects.push(c);
  }


  return projects;
}
