import { Badge } from "@/components/ui/badge";
import type { MatchResult } from "../_lib/resume-filters";
import type { ResumeSchema } from "../_lib/resume-types";
import { formatDateRange, ResumeEntryCard } from "./resume-entry-card";

interface SectionProps {
  title: string;
  children: React.ReactNode;
  visible?: boolean;
}

export function Section({ title, children, visible = true }: SectionProps) {
  if (!visible) return null;

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function WorkSection({
  work,
  matches,
  tags,
}: {
  work: ResumeSchema["work"];
  matches: Map<number, MatchResult>;
  tags: Map<number, string[]>;
}) {
  // Filter out the generic "LacyMorrow.com" self-employment entry
  const filtered = work
    .map((entry, i) => ({ entry, index: i }))
    .filter(({ entry }) => entry.name !== "LacyMorrow.com");

  return (
    <div className="space-y-0">
      {filtered.map(({ entry, index }) => (
        <ResumeEntryCard
          key={`${entry.name}-${entry.startDate}`}
          title={entry.position}
          subtitle={entry.name}
          dateRange={formatDateRange(entry.startDate, entry.endDate)}
          location={entry.location}
          summary={entry.summary}
          tags={tags.get(index) ?? []}
          url={entry.url}
          highlights={entry.highlights?.filter(Boolean)}
          match={matches.get(index)}
        />
      ))}
    </div>
  );
}

export function ProjectsSection({
  projects,
  matches,
  tags,
}: {
  projects: ResumeSchema["projects"];
  matches: Map<number, MatchResult>;
  tags: Map<number, string[]>;
}) {
  return (
    <div className="space-y-0">
      {projects.map((project, i) => (
        <ResumeEntryCard
          key={`${project.name}-${project.startDate}`}
          title={project.name}
          subtitle={project.summary.split(".")[0] ?? ""}
          dateRange={formatDateRange(project.startDate, project.endDate)}
          summary={project.summary}
          tags={tags.get(i) ?? []}
          url={project.url}
          highlights={project.highlights?.filter(Boolean)}
          match={matches.get(i)}
        />
      ))}
    </div>
  );
}

export function SkillsSection({ skills }: { skills: ResumeSchema["skills"] }) {
  return (
    <div className="space-y-4">
      {skills.map((group) => (
        <div key={group.name}>
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-sm font-semibold">{group.name}</h3>
            <Badge variant="outline" className="text-xs">
              {group.level}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {group.keywords.map((kw) => (
              <Badge key={kw} variant="secondary" className="text-xs">
                {kw}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function EducationSection({ education }: { education: ResumeSchema["education"] }) {
  return (
    <div className="space-y-4">
      {education.map((edu) => (
        <div key={edu.institution}>
          <h3 className="font-semibold">
            {edu.studyType} — {edu.area}
          </h3>
          <p className="text-sm text-muted-foreground">{edu.institution}</p>
          <p className="text-xs text-muted-foreground/70">
            {formatDateRange(edu.startDate, edu.endDate)}
          </p>
        </div>
      ))}
    </div>
  );
}

export function ExtrasSection({
  interests,
  awards,
  references,
  showInterests,
  showAwards,
  showReferences,
}: {
  interests: ResumeSchema["interests"];
  awards: ResumeSchema["awards"];
  references: ResumeSchema["references"];
  showInterests: boolean;
  showAwards: boolean;
  showReferences: boolean;
}) {
  return (
    <>
      {showInterests && interests.length > 0 && (
        <Section title="Interests">
          <div className="flex flex-wrap gap-1.5">
            {interests.map((i) => (
              <Badge key={i.name} variant="outline" className="text-xs">
                {i.name}
              </Badge>
            ))}
          </div>
        </Section>
      )}

      {showAwards && awards.length > 0 && (
        <Section title="Awards">
          {awards.map((a) => (
            <div key={a.title} className="text-sm">
              <span className="font-medium">{a.title}</span>
              <span className="text-muted-foreground">
                {" "}
                — {a.awarder}, {new Date(a.date).getFullYear()}
              </span>
            </div>
          ))}
        </Section>
      )}

      {showReferences && references.length > 0 && (
        <Section title="References">
          {references.map((r) => (
            <blockquote
              key={r.name}
              className="border-l-2 border-muted pl-4 text-sm text-muted-foreground italic"
            >
              <p>&quot;{r.reference}&quot;</p>
              <footer className="mt-1 text-xs font-medium not-italic">— {r.name}</footer>
            </blockquote>
          ))}
        </Section>
      )}
    </>
  );
}
